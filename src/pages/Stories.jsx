import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';

export default function Stories() {
  const { members } = useFamily();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null or story object
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [taggedMemberIds, setTaggedMemberIds] = useState([]);
  const [tagsInput, setTagsInput] = useState('');

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch('/api/stories');
      const data = await res.json();
      setStories(data);
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const resetForm = () => {
    setTitle(''); setContent(''); setTaggedMemberIds([]); setTagsInput('');
    setEditing(null); setShowForm(false);
  };

  const startEdit = (story) => {
    setEditing(story);
    setTitle(story.title);
    setContent(story.content);
    setTaggedMemberIds(story.memberIds || []);
    setTagsInput((story.tags || []).join(', '));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return alert('Title and content are required');
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editing?.id,
        title, content,
        memberIds: taggedMemberIds,
        tags,
      }),
    });
    resetForm();
    await fetchStories();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    await fetch(`/api/stories/${id}`, { method: 'DELETE' });
    setStories(prev => prev.filter(s => s.id !== id));
  };

  const toggleMemberTag = (memberId) => {
    setTaggedMemberIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-3 border-saffron-200 border-t-saffron-600 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Stories <span className="font-telugu text-lg text-saffron-400">కథలు</span></h1>
          <p className="text-stone-500 text-sm mt-1">Record family stories, traditions, and oral history</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">
          + New Story
        </button>
      </div>

      {/* Story Form */}
      {showForm && (
        <div className="card mb-8 border-saffron-200 bg-saffron-50/30">
          <h3 className="card-header">{editing ? 'Edit Story' : 'New Story'}</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., How our grandparents met..." />
            </div>
            <div>
              <label className="label">Story *</label>
              <textarea
                className="input min-h-[200px]"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write the story here... You can include details, quotes, memories..."
              />
            </div>
            <div>
              <label className="label">Tag Family Members</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-white rounded-lg border border-stone-200">
                {members.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMemberTag(m.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      taggedMemberIds.includes(m.id)
                        ? 'bg-saffron-100 text-saffron-700 border border-saffron-300'
                        : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    {m.firstName} {m.lastName || ''}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input className="input" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g., tradition, wedding, migration" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="btn btn-primary">
                {editing ? 'Update Story' : 'Save Story'}
              </button>
              <button onClick={resetForm} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Stories List */}
      {stories.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📖</p>
          <p className="text-stone-500 text-lg">No stories yet</p>
          <p className="text-stone-400 text-sm mt-1">Every family has stories worth preserving. Start writing yours.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {stories.map(story => (
            <div key={story.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-stone-800 font-display">{story.title}</h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {story.updated_at ? new Date(story.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(story)} className="text-xs text-stone-400 hover:text-saffron-600 transition">Edit</button>
                  <button onClick={() => handleDelete(story.id)} className="text-xs text-stone-400 hover:text-red-500 transition">Delete</button>
                </div>
              </div>

              <div className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap mb-4">
                {story.content}
              </div>

              {/* Tagged members */}
              {story.memberIds?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs text-stone-400 mr-1">Tagged:</span>
                  {story.memberIds.map(id => {
                    const m = members.find(x => x.id === id);
                    return m ? (
                      <Link key={id} to={`/members/${id}`} className="badge bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-xs">
                        {m.firstName} {m.lastName || ''}
                      </Link>
                    ) : null;
                  })}
                </div>
              )}

              {/* Tags */}
              {story.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {story.tags.map((tag, i) => (
                    <span key={i} className="badge bg-saffron-50 text-saffron-600 text-xs">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
