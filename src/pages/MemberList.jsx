import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { calculateAge } from '../data/vedic';

export default function MemberList() {
  const { members, deleteMember } = useFamily();
  const [search, setSearch] = useState('');
  const [showDeceased, setShowDeceased] = useState(true);
  const [sortBy, setSortBy] = useState('name');

  const filtered = useMemo(() => {
    let result = members;

    if (!showDeceased) {
      result = result.filter(m => !m.isDeceased);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        m.gotram?.toLowerCase().includes(q) ||
        m.nakshatram?.toLowerCase().includes(q) ||
        m.pob?.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sortBy === 'age') return (a.dob || '').localeCompare(b.dob || '');
      if (sortBy === 'gotram') return (a.gotram || '').localeCompare(b.gotram || '');
      return 0;
    });

    return result;
  }, [members, search, showDeceased, sortBy]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name}? This will also remove all references to them.`)) {
      await deleteMember(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Family Members</h1>
          <p className="text-stone-500 text-sm mt-1">{filtered.length} of {members.length} members</p>
        </div>
        <Link to="/members/new" className="btn btn-primary">+ Add Member</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          className="input flex-1"
          placeholder="Search by name, gotram, nakshatram, place..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          <select className="select w-auto" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">Sort: Name</option>
            <option value="age">Sort: Age</option>
            <option value="gotram">Sort: Gotram</option>
          </select>
          <label className="flex items-center gap-2 px-3 bg-white border border-stone-300 rounded-lg text-sm cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-stone-300 text-saffron-600"
              checked={showDeceased}
              onChange={e => setShowDeceased(e.target.checked)}
            />
            Deceased
          </label>
        </div>
      </div>

      {/* Members Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-lg">No members found</p>
          <Link to="/members/new" className="text-saffron-600 hover:underline text-sm mt-2 block">Add your first family member</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => (
            <MemberCard key={member.id} member={member} members={members} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, members, onDelete }) {
  const age = calculateAge(member.dob, member.isDeceased && member.dateOfDeath ? new Date(member.dateOfDeath) : undefined);
  const father = member.fatherId ? members.find(m => m.id === member.fatherId) : null;
  const mother = member.motherId ? members.find(m => m.id === member.motherId) : null;
  const spouse = member.spouseId ? members.find(m => m.id === member.spouseId) : null;

  return (
    <div className={`card group relative ${member.isDeceased ? 'opacity-70' : ''}`}>
      {/* Actions */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Link to={`/members/${member.id}/edit`} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600" title="Edit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </Link>
        <button onClick={() => onDelete(member.id, `${member.firstName} ${member.lastName}`)} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500" title="Delete">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      <Link to={`/members/${member.id}`} className="block">
        {/* Avatar */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
            member.gender === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
          }`}>
            {member.firstName?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-stone-800 truncate">
              {member.firstName} {member.lastName}
              {member.isDeceased && <span className="ml-1 text-stone-400" title="Deceased">✦</span>}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`badge ${member.gender === 'Male' ? 'badge-male' : 'badge-female'}`}>
                {member.gender}
              </span>
              {age !== null && (
                <span className="text-xs text-stone-500">
                  {member.isDeceased ? `Lived ${age}y` : `${age}y`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1 text-xs text-stone-500">
          {member.dob && <p>Born: {new Date(member.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
          {member.gotram && <p>Gotram: <span className="text-saffron-600 font-medium">{member.gotram}</span></p>}
          {member.nakshatram && <p>Nakshatram: {member.nakshatram} {member.pada ? `(Pada ${member.pada})` : ''}</p>}
          {spouse && <p>Spouse: {spouse.firstName} {spouse.lastName}</p>}
          {(father || mother) && (
            <p>Parents: {[father, mother].filter(Boolean).map(p => p.firstName).join(' & ')}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
