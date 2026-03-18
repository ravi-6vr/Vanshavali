/**
 * Kula (కుల) — Orchestrator Agent
 *
 * The central router that:
 * 1. Receives user queries
 * 2. Decides which specialized agent(s) to invoke
 * 3. Dispatches sub-queries (parallel or sequential)
 * 4. Synthesizes final responses from agent results
 */

import { Agent } from './agent-runtime.js';
import { MessageBus } from './message-bus.js';
import { createRelationshipAgent } from './agents/relationship-agent.js';
import { createHealthAgent } from './agents/health-agent.js';
import { createStoryAgent } from './agents/story-agent.js';
import { createCulturalAgent } from './agents/cultural-agent.js';

const ORCHESTRATOR_PROMPT = `You are Kula (కుల), the orchestrator for Vanshavali — a family genealogy system. You coordinate specialized agents to answer user queries about a family tree.

Available agents:
{AGENT_DIRECTORY}

Your job:
1. Understand the user's question
2. Call the route_to_agent tool to dispatch the query to the right agent(s)
3. If a query spans multiple domains, call route_to_agent multiple times for different agents
4. Synthesize the results into a clear, helpful response

Routing guidelines:
- Relationship questions (who is related, ancestry, lineage) → Bandhuvulu
- Health questions (conditions, hereditary risks) → Arogya
- Story/narrative requests (tell me about, life story, family history) → Katha
- Cultural/Vedic questions (gotram, nakshatram, shraddha, samskara, compatibility) → Samskara
- Complex queries may need multiple agents — route to each one

After receiving agent responses, synthesize them into ONE cohesive answer for the user. Do not just pass through raw agent output. Add context, combine findings, and present clearly.`;

// The orchestrator's only tool: route to sub-agents
const routeToolDef = {
  name: 'route_to_agent',
  description: 'Send a query to a specialized agent. Use this to dispatch questions to the right expert.',
  parameters: {
    type: 'object',
    properties: {
      agent_name: {
        type: 'string',
        enum: ['Bandhuvulu', 'Arogya', 'Katha', 'Samskara'],
        description: 'Which agent to send the query to',
      },
      query: {
        type: 'string',
        description: 'The specific question or task for the agent',
      },
    },
    required: ['agent_name', 'query'],
  },
};

export function createAgentSystem(db, config = {}) {
  const bus = new MessageBus();

  // Create and register all agents
  const agents = {
    relationship: createRelationshipAgent(db),
    health: createHealthAgent(db),
    story: createStoryAgent(db),
    cultural: createCulturalAgent(db),
  };

  // Override model if provided in config
  if (config.model) {
    Object.values(agents).forEach(a => { a.model = config.model; });
  }

  bus.register(agents.relationship);
  bus.register(agents.health);
  bus.register(agents.story);
  bus.register(agents.cultural);

  // Build orchestrator with agent directory
  const directory = bus.getAgentDirectory()
    .map(a => `- **${a.name}**: ${a.description}`)
    .join('\n');

  const orchestratorPrompt = ORCHESTRATOR_PROMPT.replace('{AGENT_DIRECTORY}', directory);

  const orchestrator = new Agent({
    name: 'Kula',
    description: 'Orchestrator — routes queries to specialized agents and synthesizes responses',
    systemPrompt: orchestratorPrompt,
    model: config.model || undefined,
    tools: [{
      definition: routeToolDef,
      handler: async ({ agent_name, query }) => {
        const result = await bus.dispatch(agent_name, query);
        return {
          agent: result.agent,
          response: result.content,
          toolsUsed: result.toolEvents?.map(e => e.tool) || [],
        };
      },
    }],
  });

  return {
    orchestrator,
    bus,
    agents,

    /** Main entry point: send a user message, get a response */
    async chat(message, { sessionId = 'default' } = {}) {
      bus.addToHistory(sessionId, 'user', message);

      const history = bus.getHistory(sessionId).slice(0, -1); // exclude the message we just added
      const context = history.map(h => ({ role: h.role, content: h.content }));

      const result = await orchestrator.run(message, { context });

      bus.addToHistory(sessionId, 'assistant', result.content);

      // Collect all tool events from sub-agents too
      const sessionContext = bus.getSessionContext(sessionId);
      const agentsUsed = [...new Set(sessionContext.map(r => r.agent))];

      return {
        content: result.content,
        agentsUsed,
        toolEvents: result.toolEvents,
        sessionId,
      };
    },

    /** Update LLM config at runtime (when user changes settings) */
    updateConfig({ apiKey, baseUrl, model }) {
      if (apiKey !== undefined) process.env.OLLAMA_API_KEY = apiKey;
      if (baseUrl !== undefined) process.env.OLLAMA_BASE_URL = baseUrl;
      if (model) {
        orchestrator.model = model;
        Object.values(agents).forEach(a => { a.model = model; });
      }
    },
  };
}
