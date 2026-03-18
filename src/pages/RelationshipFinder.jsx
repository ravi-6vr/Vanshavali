import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { FamilyGraph } from '../utils/relationships';

export default function RelationshipFinder() {
  const { members } = useFamily();
  const [personA, setPersonA] = useState('');
  const [personB, setPersonB] = useState('');
  const [result, setResult] = useState(null);

  const graph = useMemo(() => new FamilyGraph(members), [members]);

  const sortedMembers = useMemo(() =>
    [...members].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [members]
  );

  // Detect disconnected members
  const orphans = useMemo(() => graph.getOrphans(), [graph]);
  const stats = useMemo(() => graph.getStats(), [graph]);

  const handleFind = () => {
    if (!personA || !personB) return;
    const rel = graph.findRelationship(personA, personB);
    setResult(rel);
  };

  const handleSwap = () => {
    setPersonA(personB);
    setPersonB(personA);
    setResult(null);
  };

  const memberA = members.find(m => m.id === personA);
  const memberB = members.find(m => m.id === personB);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Relationship Finder <span className="font-telugu text-lg text-saffron-400">బంధుత్వం</span></h1>
        <p className="text-stone-500 text-sm mt-1">
          Find how two family members are related — with Telugu & Hindi terms
        </p>
      </div>

      {/* Disconnected members warning */}
      {orphans.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 mb-1">
            {orphans.length} disconnected member{orphans.length > 1 ? 's' : ''} detected
          </p>
          <p className="text-xs text-amber-600 mb-2">
            These members aren't linked to the main family tree. Relationships involving them will show "not connected".
          </p>
          <div className="flex flex-wrap gap-1.5">
            {orphans.map(m => (
              <Link
                key={m.id}
                to={`/members/${m.id}`}
                className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full hover:bg-amber-200 transition"
              >
                {m.firstName} {m.lastName || ''}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="label">Person A</label>
            <select className="select" value={personA} onChange={e => { setPersonA(e.target.value); setResult(null); }}>
              <option value="">-- Select --</option>
              {sortedMembers.map(m => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <button onClick={handleSwap} className="btn btn-ghost p-2" title="Swap">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </button>
          </div>

          <div className="md:col-span-2">
            <label className="label">Person B</label>
            <select className="select" value={personB} onChange={e => { setPersonB(e.target.value); setResult(null); }}>
              <option value="">-- Select --</option>
              {sortedMembers.map(m => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={handleFind}
            disabled={!personA || !personB}
            className="btn btn-primary px-8"
          >
            Find Relationship
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card bg-gradient-to-br from-saffron-50 to-white border-saffron-200">
          {result.key === 'self' ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">🙏</p>
              <p className="text-lg text-stone-600">Same person!</p>
            </div>
          ) : result.key === 'unknown' ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-lg text-stone-600 font-medium">Not connected</p>
              <p className="text-sm text-stone-500 mt-2 max-w-md mx-auto">
                {result.description}
              </p>
              <p className="text-xs text-stone-400 mt-3">
                Link them by editing their profiles and setting parent or spouse relationships.
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              {/* Person A */}
              <div className="mb-4">
                <Link to={`/members/${personA}`} className="font-display text-lg font-semibold text-stone-800 hover:text-saffron-600">
                  {memberA?.firstName} {memberA?.lastName}
                </Link>
              </div>

              {/* Relationship Arrow */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px bg-saffron-300 w-16" />
                <span className="text-saffron-500">is the</span>
                <div className="h-px bg-saffron-300 w-16" />
              </div>

              {/* Relationship Term */}
              <div className="bg-white rounded-xl p-6 border border-saffron-200 shadow-sm inline-block">
                <p className="text-2xl font-display font-bold text-saffron-700 mb-3">
                  {result.terms.en}
                </p>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-stone-400 w-16 inline-block">తెలుగు:</span>
                    <span className="font-semibold text-stone-700 font-telugu">{result.terms.te}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-stone-400 w-16 inline-block">हिंदी:</span>
                    <span className="font-semibold text-stone-700">{result.terms.hi}</span>
                  </p>
                </div>
              </div>

              {/* Destination */}
              <div className="flex items-center justify-center gap-3 mt-4 mb-4">
                <div className="h-px bg-saffron-300 w-16" />
                <span className="text-saffron-500">of</span>
                <div className="h-px bg-saffron-300 w-16" />
              </div>

              <div>
                <Link to={`/members/${personB}`} className="font-display text-lg font-semibold text-stone-800 hover:text-saffron-600">
                  {memberB?.firstName} {memberB?.lastName}
                </Link>
              </div>

              {/* Generation & Path info */}
              <div className="mt-6 pt-4 border-t border-saffron-100 space-y-2">
                {result.generation !== undefined && result.generation !== 0 && (
                  <p className="text-xs text-stone-500">
                    <span className="text-stone-400">Generation gap:</span>{' '}
                    {Math.abs(result.generation)} generation{Math.abs(result.generation) > 1 ? 's' : ''}{' '}
                    {result.generation > 0 ? 'younger' : 'older'}
                  </p>
                )}
                {result.steps && (
                  <p className="text-xs text-stone-400">
                    {result.steps} step{result.steps > 1 ? 's' : ''} apart
                  </p>
                )}
                {result.pathDescription && (
                  <>
                    <p className="text-xs text-stone-400 uppercase tracking-wider mt-2">Path</p>
                    <p className="text-sm text-stone-500">{result.pathDescription}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tree Stats */}
      {stats.connectedComponents > 1 && (
        <div className="mt-6 card">
          <h3 className="card-header text-sm">Graph Insights</h3>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="p-2 bg-stone-50 rounded-lg">
              <p className="text-xs text-stone-400">Components</p>
              <p className="text-lg font-semibold text-stone-700">{stats.connectedComponents}</p>
            </div>
            <div className="p-2 bg-stone-50 rounded-lg">
              <p className="text-xs text-stone-400">Max Depth</p>
              <p className="text-lg font-semibold text-stone-700">{stats.maxGenerationDepth}</p>
            </div>
            <div className="p-2 bg-stone-50 rounded-lg">
              <p className="text-xs text-stone-400">Root Ancestors</p>
              <p className="text-lg font-semibold text-stone-700">{stats.rootAncestors.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
