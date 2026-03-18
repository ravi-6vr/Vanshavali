/**
 * Agent Runtime — Base class for all LLM agents.
 *
 * Each agent has a system prompt, a set of tools, and can call the LLM
 * with function/tool calling support. The runtime handles the tool
 * execution loop: LLM requests tool → agent executes → feeds result back.
 *
 * Supports multiple providers:
 * - Ollama Cloud (https://ollama.com/api) — native Ollama format
 * - OpenAI-compatible APIs (/v1/chat/completions) — OpenAI, Groq, Together, local Ollama
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://ollama.com';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen3-vl:235b-instruct';

/**
 * Detect whether a base URL points to Ollama Cloud (native API)
 * vs an OpenAI-compatible endpoint.
 */
function isOllamaCloud(baseUrl) {
  return baseUrl.includes('ollama.com');
}

/**
 * Detect if this is a local Ollama instance.
 */
function isLocalOllama(baseUrl) {
  return baseUrl.includes('localhost:11434') || baseUrl.includes('127.0.0.1:11434');
}

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

      // Normalize response — Ollama native and OpenAI have different formats
      const choice = response.choices?.[0] || this._normalizeOllamaResponse(response);

      if (!choice) {
        return { content: 'No response from model.', agent: this.name, toolEvents };
      }

      // If the model wants to call tools
      if (choice.finish_reason === 'tool_calls' || choice.message?.tool_calls?.length) {
        messages.push(choice.message);

        for (const toolCall of choice.message.tool_calls) {
          const toolName = toolCall.function.name;
          const rawArgs = toolCall.function.arguments || '{}';
          const toolArgs = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
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

  /**
   * Normalize Ollama native /api/chat response to OpenAI-like format.
   * Ollama returns: { message: { role, content, tool_calls }, done }
   * OpenAI returns: { choices: [{ message, finish_reason }] }
   */
  _normalizeOllamaResponse(response) {
    if (response.message) {
      return {
        message: response.message,
        finish_reason: response.message.tool_calls?.length ? 'tool_calls' : 'stop',
      };
    }
    return null;
  }

  async _callLLM(messages, tools) {
    // Read at call time, not import time — updateConfig sets process.env
    const baseUrl = process.env.OLLAMA_BASE_URL || OLLAMA_BASE_URL;
    const apiKey = process.env.OLLAMA_API_KEY || OLLAMA_API_KEY;

    // Determine endpoint format based on provider
    if (isOllamaCloud(baseUrl) || isLocalOllama(baseUrl)) {
      // Ollama native API: POST /api/chat
      const url = isOllamaCloud(baseUrl)
        ? `${baseUrl.replace(/\/$/, '')}/api/chat`
        : `${baseUrl.replace(/\/v1\/?$/, '')}/api/chat`;

      const body = {
        model: this.model,
        messages,
        stream: false,
        options: { temperature: 0.3 },
      };

      if (tools.length > 0) {
        body.tools = tools;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`LLM API error (${res.status}): ${text}`);
      }

      return res.json();
    }

    // OpenAI-compatible API: POST /v1/chat/completions
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    const body = {
      model: this.model,
      messages,
      temperature: 0.3,
    };

    if (tools.length > 0) {
      body.tools = tools;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
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
