import { useState, useMemo } from 'react';
import { useFamily } from '../context/FamilyContext';
import { GotraCompatibility } from '../components/PravaraGenerator';
import { GOTRAM_DATA } from '../data/vedic';

export default function GotraChecker() {
  const { members } = useFamily();
  const [gotram1, setGotram1] = useState('');
  const [gotram2, setGotram2] = useState('');
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [mode, setMode] = useState('manual'); // 'manual' | 'members'
  const [person1, setPerson1] = useState('');
  const [person2, setPerson2] = useState('');

  const sortedMembers = useMemo(() =>
    [...members].filter(m => m.gotram).sort((a, b) => `${a.firstName}`.localeCompare(`${b.firstName}`)),
    [members]
  );

  // When selecting members, auto-fill gotram
  const handlePerson1Change = (id) => {
    setPerson1(id);
    const m = members.find(x => x.id === id);
    if (m) { setGotram1(m.gotram || ''); setName1(`${m.firstName} ${m.lastName || ''}`); }
  };
  const handlePerson2Change = (id) => {
    setPerson2(id);
    const m = members.find(x => x.id === id);
    if (m) { setGotram2(m.gotram || ''); setName2(`${m.firstName} ${m.lastName || ''}`); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Gotra Compatibility</h1>
        <p className="text-stone-500 text-sm mt-1">
          Check if two Gotrams are compatible for marriage based on traditional rules —
          same Gotra or shared Pravara Rishis indicate incompatibility.
        </p>
      </div>

      <div className="card mb-6">
        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('members')}
            className={`btn text-sm ${mode === 'members' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Select from Members
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`btn text-sm ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Enter Manually
          </button>
        </div>

        {mode === 'members' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Person 1</label>
              <select className="select" value={person1} onChange={e => handlePerson1Change(e.target.value)}>
                <option value="">-- Select --</option>
                {sortedMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.gotram})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Person 2</label>
              <select className="select" value={person2} onChange={e => handlePerson2Change(e.target.value)}>
                <option value="">-- Select --</option>
                {sortedMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.gotram})</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Gotram 1</label>
              <select className="select" value={gotram1} onChange={e => setGotram1(e.target.value)}>
                <option value="">-- Select --</option>
                {GOTRAM_DATA.map(g => (
                  <option key={g.name} value={g.name}>{g.name} (Rishi: {g.rishi})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Gotram 2</label>
              <select className="select" value={gotram2} onChange={e => setGotram2(e.target.value)}>
                <option value="">-- Select --</option>
                {GOTRAM_DATA.map(g => (
                  <option key={g.name} value={g.name}>{g.name} (Rishi: {g.rishi})</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      {gotram1 && gotram2 && (
        <GotraCompatibility gotram1={gotram1} gotram2={gotram2} name1={name1} name2={name2} />
      )}

      {/* Gotram Reference */}
      <div className="card mt-6">
        <h3 className="card-header">Gotram Reference</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left py-2 px-3 text-xs text-stone-400 font-medium uppercase">Gotram</th>
                <th className="text-left py-2 px-3 text-xs text-stone-400 font-medium uppercase">Rishi</th>
                <th className="text-left py-2 px-3 text-xs text-stone-400 font-medium uppercase">Pravara</th>
              </tr>
            </thead>
            <tbody>
              {GOTRAM_DATA.map(g => (
                <tr key={g.name} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="py-2 px-3 font-medium text-stone-700">{g.name}</td>
                  <td className="py-2 px-3 text-stone-500">{g.rishi}</td>
                  <td className="py-2 px-3 text-stone-500 text-xs">{g.pravara.join(' → ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
