import { useState, useRef, useEffect } from 'react';

const AGENT_COLORS = {
  Kula: 'text-purple-700 bg-purple-50',
  Bandhuvulu: 'text-blue-700 bg-blue-50',
  Arogya: 'text-green-700 bg-green-50',
  Katha: 'text-amber-700 bg-amber-50',
  Samskara: 'text-saffron-700 bg-saffron-50',
};

const AGENT_LABELS = {
  Bandhuvulu: 'Relationships',
  Arogya: 'Health',
  Katha: 'Stories',
  Samskara: 'Cultural',
};

export default function AIChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get AI config from localStorage
  function getAIConfig() {
    try {
      const stored = localStorage.getItem('vanshavali-ai-config');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }

  const config = getAIConfig();
  const isConfigured = !!(config?.apiKey || config?.provider === 'local');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcut: Ctrl+Shift+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          sessionId,
          config: getAIConfig(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [...prev, {
          role: 'error',
          content: data.error || 'Something went wrong',
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.content,
          agentsUsed: data.agentsUsed || [],
          toolEvents: data.toolEvents || [],
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: `Network error: ${err.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-saffron-600 hover:bg-saffron-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        title="AI Chat (Ctrl+Shift+K)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-saffron-600 to-saffron-700 text-white flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Kula AI Assistant</h3>
          <p className="text-xs text-saffron-100">Ask about your family tree</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!isConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <p className="font-medium">AI not configured</p>
            <p className="mt-1 text-xs">Go to <strong>Settings &rarr; AI Configuration</strong> to add your Ollama Cloud API key. The app works fully without AI — this is an optional feature.</p>
          </div>
        )}

        {messages.length === 0 && isConfigured && (
          <div className="text-center text-stone-400 text-sm py-8">
            <p className="mb-3">Try asking:</p>
            <div className="space-y-2">
              {[
                'How is Aditya related to Nikhil?',
                'Does diabetes run in the family?',
                'Tell me about grandfather\'s life',
                'Can Arjun marry someone from Kashyapa gotram?',
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="block w-full text-left px-3 py-2 bg-stone-50 hover:bg-stone-100 rounded-lg text-xs text-stone-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-saffron-600 text-white'
                : msg.role === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-stone-100 text-stone-800'
            }`}>
              {/* Agent badges */}
              {msg.agentsUsed?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {msg.agentsUsed.map(agent => (
                    <span key={agent} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${AGENT_COLORS[agent] || 'text-stone-600 bg-stone-50'}`}>
                      {AGENT_LABELS[agent] || agent}
                    </span>
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-xl px-4 py-3 text-sm text-stone-500">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs">Agents thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-stone-200">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isConfigured ? 'Ask about your family...' : 'Configure AI in Settings first'}
            disabled={!isConfigured || loading}
            className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:border-transparent disabled:bg-stone-50 disabled:text-stone-400"
          />
          <button
            type="submit"
            disabled={!isConfigured || loading || !input.trim()}
            className="px-3 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
