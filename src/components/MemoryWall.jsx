/**
 * Memory Wall — Stories, anecdotes, recipes, and quotes attached to a person
 */

import { useState } from 'react';

const MEMORY_TYPES = [
  { key: 'story', label: 'Memory / Story', icon: '📖', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'recipe', label: 'Recipe', icon: '🍲', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { key: 'quote', label: 'Quote / Saying', icon: '💬', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { key: 'lesson', label: 'Life Lesson', icon: '🙏', color: 'bg-saffron-50 border-saffron-200 text-saffron-700' },
  { key: 'tradition', label: 'Family Tradition', icon: '🪔', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
];

export default function MemoryWall({ memories = [], onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [newMemory, setNewMemory] = useState({ type: 'story', title: '', content: '', date: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMemory.content.trim()) return;
    onAdd({
      ...newMemory,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
    setNewMemory({ type: 'story', title: '', content: '', date: '' });
    setShowForm(false);
  };

  const getTypeInfo = (type) => MEMORY_TYPES.find(t => t.key === type) || MEMORY_TYPES[0];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="card-header mb-0 pb-0 border-0">Memories & Stories</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-secondary text-sm">
          {showForm ? 'Cancel' : '+ Add Memory'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-stone-50 rounded-lg p-4 mb-4 border border-stone-200">
          {/* Type selector */}
          <div className="flex flex-wrap gap-2 mb-3">
            {MEMORY_TYPES.map(type => (
              <button
                key={type.key}
                type="button"
                onClick={() => setNewMemory(prev => ({ ...prev, type: type.key }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  newMemory.type === type.key
                    ? type.color + ' shadow-sm'
                    : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          <input
            className="input mb-2"
            placeholder="Title (optional)"
            value={newMemory.title}
            onChange={e => setNewMemory(prev => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            className="input mb-2"
            rows={4}
            placeholder={
              newMemory.type === 'recipe' ? "Write the recipe — ingredients, steps, tips..." :
              newMemory.type === 'quote' ? "What did they say? In their words..." :
              newMemory.type === 'lesson' ? "What life lesson did they teach?" :
              newMemory.type === 'tradition' ? "Describe the family tradition..." :
              "Share a memory or story about this person..."
            }
            value={newMemory.content}
            onChange={e => setNewMemory(prev => ({ ...prev, content: e.target.value }))}
          />
          <div className="flex items-center justify-between">
            <input
              type="date"
              className="input w-auto"
              value={newMemory.date}
              onChange={e => setNewMemory(prev => ({ ...prev, date: e.target.value }))}
              placeholder="Date (optional)"
            />
            <button type="submit" className="btn btn-primary">Save Memory</button>
          </div>
        </form>
      )}

      {/* Memories list */}
      {memories.length === 0 ? (
        <div className="text-center py-8 text-stone-400">
          <p className="text-3xl mb-2">📖</p>
          <p className="text-sm">No memories added yet</p>
          <p className="text-xs mt-1">Add stories, recipes, quotes, and traditions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map(memory => {
            const typeInfo = getTypeInfo(memory.type);
            return (
              <div key={memory.id} className={`rounded-lg p-4 border ${typeInfo.color}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{typeInfo.icon}</span>
                    <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                      {typeInfo.label}
                    </span>
                    {memory.date && (
                      <span className="text-xs opacity-50">
                        {new Date(memory.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  {onDelete && (
                    <button onClick={() => onDelete(memory.id)} className="text-xs opacity-40 hover:opacity-100 hover:text-red-500">
                      Remove
                    </button>
                  )}
                </div>
                {memory.title && <h4 className="font-semibold text-sm mb-1">{memory.title}</h4>}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{memory.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
