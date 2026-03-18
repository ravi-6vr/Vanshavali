/**
 * Message Bus — Agent-to-agent communication and shared context.
 *
 * The orchestrator uses this to dispatch queries to sub-agents,
 * collect their responses, and maintain shared context across
 * a multi-agent conversation session.
 */

export class MessageBus {
  constructor() {
    this.agents = new Map();       // name → Agent instance
    this.sessions = new Map();     // sessionId → { history, context }
  }

  /** Register an agent so the orchestrator can dispatch to it. */
  register(agent) {
    this.agents.set(agent.name, agent);
  }

  /** Get all registered agent names + descriptions (for orchestrator routing). */
  getAgentDirectory() {
    return Array.from(this.agents.entries()).map(([name, agent]) => ({
      name,
      description: agent.description,
    }));
  }

  /** Dispatch a query to a specific agent. */
  async dispatch(agentName, message, { sessionId, context = [] } = {}) {
    const agent = this.agents.get(agentName);
    if (!agent) {
      return { content: `Agent "${agentName}" not found.`, agent: agentName, toolEvents: [] };
    }

    const session = this._getSession(sessionId);
    const result = await agent.run(message, { context });

    // Store in session for cross-agent context
    session.agentResults.push({
      agent: agentName,
      query: message,
      response: result.content,
      timestamp: Date.now(),
    });

    return result;
  }

  /** Dispatch to multiple agents in parallel. */
  async dispatchParallel(tasks, { sessionId } = {}) {
    const results = await Promise.all(
      tasks.map(({ agent, message, context }) =>
        this.dispatch(agent, message, { sessionId, context })
      )
    );
    return results;
  }

  /** Get accumulated context from all agent results in a session. */
  getSessionContext(sessionId) {
    const session = this._getSession(sessionId);
    return session.agentResults;
  }

  /** Get or create a session. */
  _getSession(sessionId) {
    if (!sessionId) sessionId = 'default';
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        history: [],
        agentResults: [],
        createdAt: Date.now(),
      });
    }
    return this.sessions.get(sessionId);
  }

  /** Add a user/assistant message to session history. */
  addToHistory(sessionId, role, content) {
    const session = this._getSession(sessionId);
    session.history.push({ role, content });
    // Keep history manageable
    if (session.history.length > 50) {
      session.history = session.history.slice(-30);
    }
  }

  /** Get session conversation history. */
  getHistory(sessionId) {
    return this._getSession(sessionId).history;
  }
}
