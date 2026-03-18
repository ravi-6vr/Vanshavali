import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function DuplicateChecker() {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [details, setDetails] = useState({});

  useEffect(() => {
    fetch('/api/duplicates')
      .then(res => res.json())
      .then(data => setDuplicates(data))
      .catch(() => setDuplicates([]))
      .finally(() => setLoading(false));
  }, []);

  const loadDetails = async (id) => {
    if (details[id]) return;
    try {
      const res = await fetch(`/api/members/${id}`);
      const data = await res.json();
      setDetails(prev => ({ ...prev, [id]: data }));
    } catch {}
  };

  const toggleExpand = async (idx) => {
    if (expanded === idx) {
      setExpanded(null);
      return;
    }
    setExpanded(idx);
    const dupe = duplicates[idx];
    await Promise.all([loadDetails(dupe.memberA.id), loadDetails(dupe.memberB.id)]);
  };

  const visible = duplicates.filter((_, i) => !dismissed.has(i));

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-3 border-saffron-200 border-t-saffron-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-400">Scanning for duplicates...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Duplicate Checker <span className="font-telugu text-lg text-saffron-400">నకిలీ తనిఖీ</span></h1>
        <p className="text-stone-500 text-sm mt-1">
          Smart detection of potential duplicate entries in your family data
        </p>
      </div>

      {/* Summary */}
      <div className={`card mb-6 ${visible.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-sacred-50 border-sacred-200'}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{visible.length > 0 ? '⚠️' : '✅'}</span>
          <div>
            <p className="font-semibold text-stone-800">
              {visible.length > 0
                ? `${visible.length} potential duplicate${visible.length > 1 ? 's' : ''} found`
                : 'No duplicates detected'}
            </p>
            <p className="text-xs text-stone-500">
              {visible.length > 0
                ? 'Review each pair and dismiss false positives'
                : 'Your data is clean! All members appear to be unique.'}
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate pairs */}
      <div className="space-y-4">
        {duplicates.map((dupe, idx) => {
          if (dismissed.has(idx)) return null;
          const isExpanded = expanded === idx;
          const a = details[dupe.memberA.id];
          const b = details[dupe.memberB.id];

          return (
            <div key={idx} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link to={`/members/${dupe.memberA.id}`} className="font-semibold text-stone-700 hover:text-saffron-600">
                      {dupe.memberA.name}
                    </Link>
                    <span className="text-stone-400 text-sm">vs</span>
                    <Link to={`/members/${dupe.memberB.id}`} className="font-semibold text-stone-700 hover:text-saffron-600">
                      {dupe.memberB.name}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`badge ${
                      dupe.score >= 90 ? 'bg-red-100 text-red-700' :
                      dupe.score >= 75 ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {dupe.score}% match
                    </span>
                    {dupe.reasons.map((r, i) => (
                      <span key={i} className="badge bg-stone-100 text-stone-600">{r}</span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => toggleExpand(idx)}
                    className="text-xs text-saffron-600 hover:text-saffron-700"
                  >
                    {isExpanded ? 'Collapse' : 'Compare'}
                  </button>
                  <button
                    onClick={() => setDismissed(prev => new Set([...prev, idx]))}
                    className="text-xs text-stone-400 hover:text-stone-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Expanded comparison */}
              {isExpanded && a && b && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <div className="grid grid-cols-2 gap-4">
                    <CompareCard member={a} />
                    <CompareCard member={b} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompareCard({ member }) {
  return (
    <div className="bg-stone-50 rounded-lg p-4 text-sm">
      <p className="font-semibold text-stone-800 mb-2">{member.firstName} {member.lastName || ''}</p>
      <div className="space-y-1.5 text-xs">
        <Row label="Gender" value={member.gender} />
        <Row label="DOB" value={member.dob || '-'} />
        <Row label="Place" value={member.pob || '-'} />
        <Row label="Gotram" value={member.gotram || '-'} />
        <Row label="Nakshatram" value={member.nakshatram || '-'} />
        <Row label="Deceased" value={member.isDeceased ? 'Yes' : 'No'} />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-400">{label}</span>
      <span className="text-stone-700 font-medium">{value}</span>
    </div>
  );
}
