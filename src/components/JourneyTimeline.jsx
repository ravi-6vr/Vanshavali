/**
 * Journey Timeline — Tracks locations, careers, and visits over a person's life
 * Shows relocations, jobs, transfers, and visited places with dates
 */

import { useState } from 'react';

const EVENT_TYPES = {
  relocation: { label: 'Relocation', icon: '📍', color: 'bg-blue-50 border-blue-200 text-blue-700', dot: 'bg-blue-500' },
  job: { label: 'Job / Career', icon: '💼', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
  education: { label: 'Education', icon: '🎓', color: 'bg-purple-50 border-purple-200 text-purple-700', dot: 'bg-purple-500' },
  visit: { label: 'Visit / Travel', icon: '✈️', color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500' },
  milestone: { label: 'Life Milestone', icon: '⭐', color: 'bg-saffron-50 border-saffron-200 text-saffron-700', dot: 'bg-saffron-500' },
};

export default function JourneyTimeline({ events = [], onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newEvent, setNewEvent] = useState({
    type: 'relocation',
    title: '',
    location: '',
    country: '',
    startDate: '',
    endDate: '',
    description: '',
    isCurrent: false,
  });

  const sorted = [...events]
    .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));

  const filtered = filter === 'all' ? sorted : sorted.filter(e => e.type === filter);

  // Derive current location
  const currentLocation = sorted.find(e => e.type === 'relocation' && (e.isCurrent || !e.endDate));

  // Unique countries lived in
  const countries = [...new Set(events.filter(e => e.country && e.type === 'relocation').map(e => e.country))];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;
    onAdd({
      ...newEvent,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
    setNewEvent({ type: 'relocation', title: '', location: '', country: '', startDate: '', endDate: '', description: '', isCurrent: false });
    setShowForm(false);
  };

  return (
    <div>
      {/* Current Location Banner */}
      {currentLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-xs text-blue-500 uppercase tracking-wider font-medium">Current Location</p>
            <p className="font-semibold text-blue-800">
              {currentLocation.location}{currentLocation.country ? `, ${currentLocation.country}` : ''}
            </p>
            {currentLocation.startDate && (
              <p className="text-xs text-blue-500">Since {new Date(currentLocation.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
            )}
          </div>
          {countries.length > 1 && (
            <div className="ml-auto text-right">
              <p className="text-xs text-blue-500">Countries lived in</p>
              <p className="font-semibold text-blue-800">{countries.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="card-header mb-0 pb-0 border-0">Life Journey</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-secondary text-sm">
          {showForm ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <FilterTab label="All" active={filter === 'all'} onClick={() => setFilter('all')} count={events.length} />
        {Object.entries(EVENT_TYPES).map(([key, val]) => {
          const count = events.filter(e => e.type === key).length;
          if (count === 0) return null;
          return <FilterTab key={key} label={`${val.icon} ${val.label}`} active={filter === key} onClick={() => setFilter(key)} count={count} />;
        })}
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-stone-50 rounded-lg p-4 mb-4 border border-stone-200 space-y-3">
          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(EVENT_TYPES).map(([key, val]) => (
              <button
                key={key}
                type="button"
                onClick={() => setNewEvent(prev => ({ ...prev, type: key }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  newEvent.type === key ? val.color + ' shadow-sm' : 'bg-white border-stone-200 text-stone-500'
                }`}
              >
                {val.icon} {val.label}
              </button>
            ))}
          </div>

          <input className="input" placeholder={
            newEvent.type === 'job' ? "Job title / Company name" :
            newEvent.type === 'education' ? "School / University name" :
            newEvent.type === 'visit' ? "Place visited" :
            "Title (e.g., Moved to Hyderabad)"
          } value={newEvent.title} onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))} />

          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="City / Location" value={newEvent.location}
              onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))} />
            <input className="input" placeholder="Country" value={newEvent.country}
              onChange={e => setNewEvent(prev => ({ ...prev, country: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" value={newEvent.startDate}
                onChange={e => setNewEvent(prev => ({ ...prev, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">End Date {newEvent.type === 'relocation' && '(leave empty if current)'}</label>
              <input type="date" className="input" value={newEvent.endDate}
                onChange={e => setNewEvent(prev => ({ ...prev, endDate: e.target.value }))} disabled={newEvent.isCurrent} />
            </div>
          </div>

          {newEvent.type === 'relocation' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-stone-300 text-saffron-600"
                checked={newEvent.isCurrent} onChange={e => setNewEvent(prev => ({ ...prev, isCurrent: e.target.checked, endDate: '' }))} />
              <span className="text-sm text-stone-600">This is the current location</span>
            </label>
          )}

          <textarea className="input" rows={2} placeholder="Additional details (optional)"
            value={newEvent.description} onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))} />

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary">Save Event</button>
          </div>
        </form>
      )}

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-stone-400">
          <p className="text-3xl mb-2">🗺️</p>
          <p className="text-sm">No journey events recorded yet</p>
          <p className="text-xs mt-1">Track relocations, careers, education, and travels</p>
        </div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-emerald-300 via-purple-300 to-stone-200" />
          {filtered.map((event) => {
            const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.milestone;
            const duration = event.startDate && event.endDate
              ? formatDuration(event.startDate, event.endDate)
              : event.startDate && event.isCurrent
                ? formatDuration(event.startDate, new Date().toISOString().split('T')[0]) + ' (ongoing)'
                : '';

            return (
              <div key={event.id} className="relative mb-5 last:mb-0 group">
                <div className={`absolute -left-5 w-4 h-4 rounded-full border-2 border-white shadow ${typeInfo.dot}`} />
                <div className={`rounded-lg p-4 border ${typeInfo.color} transition-shadow hover:shadow-md`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{typeInfo.icon}</span>
                      <span className="text-xs font-medium uppercase tracking-wider opacity-60">{typeInfo.label}</span>
                      {event.isCurrent && <span className="badge bg-green-100 text-green-700 text-xs">Current</span>}
                    </div>
                    {onDelete && (
                      <button onClick={() => onDelete(event.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-stone-400 hover:text-red-500 transition-opacity">
                        Remove
                      </button>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm">{event.title}</h4>
                  {(event.location || event.country) && (
                    <p className="text-xs mt-0.5 opacity-70">
                      📍 {[event.location, event.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs opacity-50">
                    {event.startDate && (
                      <span>
                        {new Date(event.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        {event.endDate && ` → ${new Date(event.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
                        {event.isCurrent && !event.endDate && ' → Present'}
                      </span>
                    )}
                    {duration && <span>({duration})</span>}
                  </div>
                  {event.description && <p className="text-xs mt-2 opacity-80 leading-relaxed">{event.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterTab({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0 ${
        active ? 'bg-saffron-50 border-saffron-300 text-saffron-700' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
      }`}
    >
      {label} <span className="ml-1 opacity-50">{count}</span>
    </button>
  );
}

function formatDuration(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const months = (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth();
  if (months < 1) return 'Less than a month';
  if (months < 12) return `${months} month${months > 1 ? 's' : ''}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}m` : `${years} year${years > 1 ? 's' : ''}`;
}
