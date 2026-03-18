/**
 * Agent Runtime — Base class for all LLM agents.
 *
 * Each agent has a system prompt, a set of tools, and can call the LLM
 * with function/tool calling support. The runtime handles the tool
 * execution loop: LLM requests tool → agent executes → feeds result back.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5';

export class Agent {
  constructor({ name, description, systemPrompt, tools = [], model = DEFAULT_MODEL }) {
    this.name = name;
    this.description = description;
    this.systemPrompt = systemPrompt;
    this.tools = tools; // Array of { definition, handler }
    this.model = model;
  }

  /**
   * Run the agent with a user message + optional conversation history.
   * Handles the tool-call loop automatically.
   */
  async run(userMessage, { context = [], maxIterations = 5 } = {}) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...context,
      { role: 'user', content: userMessage },
    ];

    const toolDefs = this.tools.map(t => ({
      type: 'function',
      function: t.definition,
    }));

    const toolEvents = []; // Track tool calls for observability

    for (let i = 0; i < maxIterations; i++) {
      const response = await this._callLLM(messages, toolDefs);
      const choice = response.choices?.[0];

      if (!choice) {
        return { content: 'No response from model.', agent: this.name, toolEvents };
      }

      // If the model wants to call tools
      if (choice.finish_reason === 'tool_calls' || choice.message?.tool_calls?.length) {
        messages.push(choice.message);

        for (const toolCall of choice.message.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
          const tool = this.tools.find(t => t.definition.name === toolName);

          let result;
          if (tool) {
            try {
              result = await tool.handler(toolArgs);
              toolEvents.push({ agent: this.name, tool: toolName, args: toolArgs, success: true });
            } catch (err) {
              result = { error: err.message };
              toolEvents.push({ agent: this.name, tool: toolName, args: toolArgs, success: false, error: err.message });
            }
          } else {
            result = { error: `Unknown tool: ${toolName}` };
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }

        continue; // Let the LLM process tool results
      }

      // Final text response
      return {
        content: choice.message?.content || '',
        agent: this.name,
        toolEvents,
      };
    }

    return { content: 'Agent reached max iterations.', agent: this.name, toolEvents };
  }

  async _callLLM(messages, tools) {
    const body = {
      model: this.model,
      messages,
      temperature: 0.3,
    };

    if (tools.length > 0) {
      body.tools = tools;
    }

    const res = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OLLAMA_API_KEY ? { 'Authorization': `Bearer ${OLLAMA_API_KEY}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LLM API error (${res.status}): ${text}`);
    }

    return res.json();
  }
}
