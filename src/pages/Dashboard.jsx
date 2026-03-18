import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { calculateAge, getUpcomingBirthdays, getUpcomingAnniversaries } from '../data/vedic';
import { getUpcomingShraddhas, getShraddhaEntries } from '../utils/shraddha';
import { getOverallCompleteness } from '../utils/completeness';
import { FamilyGraph } from '../utils/relationships';

export default function Dashboard() {
  const { members } = useFamily();

  const living = members.filter(m => !m.isDeceased);
  const deceased = members.filter(m => m.isDeceased);

  const upcomingBirthdays = getUpcomingBirthdays(members, 60);
  const upcomingAnniversaries = getUpcomingAnniversaries(members, 60);
  const upcomingShraddhas = getUpcomingShraddhas(getShraddhaEntries(members));

  const gotramMap = {};
  members.forEach(m => { if (m.gotram) gotramMap[m.gotram] = (gotramMap[m.gotram] || 0) + 1; });

  function getGeneration(memberId, visited = new Set()) {
    if (visited.has(memberId)) return 0;
    visited.add(memberId);
    const children = members.filter(m => m.fatherId === memberId || m.motherId === memberId);
    if (children.length === 0) return 1;
    return 1 + Math.max(...children.map(c => getGeneration(c.id, visited)));
  }
  const roots = members.filter(m => !m.fatherId && !m.motherId);
  const generations = roots.length > 0 ? Math.max(...roots.map(r => getGeneration(r.id))) : 0;

  const livingWithAge = living.filter(m => m.dob).map(m => ({ ...m, age: calculateAge(m.dob) })).sort((a, b) => b.age - a.age);
  const oldest = livingWithAge[0];
  const youngest = livingWithAge[livingWithAge.length - 1];

  const completeness = useMemo(() => getOverallCompleteness(members), [members]);

  // Graph analysis — connection status
  const graphInfo = useMemo(() => {
    const graph = new FamilyGraph(members);

    // Tree-root based detection: find what the main tree actually renders
    const roots = members.filter(m => !m.fatherId && !m.motherId);
    function countDesc(id, visited = new Set()) {
      if (visited.has(id)) return 0;
      visited.add(id);
      const children = members.filter(x => x.fatherId === id || x.motherId === id);
      return 1 + children.reduce((s, c) => s + countDesc(c.id, visited), 0);
    }
    const mainRoot = roots.length > 0
      ? roots.reduce((best, r) => {
          const count = countDesc(r.id);
          return count > best.count ? { root: r, count } : best;
        }, { root: roots[0], count: 0 }).root
      : null;

    // BFS from main root — fully bidirectional (up, down, spouse)
    const linkedIds = new Set();
    if (mainRoot) {
      const queue = [mainRoot.id];
      linkedIds.add(mainRoot.id);
      while (queue.length > 0) {
        const id = queue.shift();
        const m = members.find(x => x.id === id);
        if (!m) continue;

        // Spouse
        if (m.spouseId && !linkedIds.has(m.spouseId)) {
          linkedIds.add(m.spouseId);
          queue.push(m.spouseId);
        }
        // Up: this member's parents
        if (m.fatherId && !linkedIds.has(m.fatherId)) {
          linkedIds.add(m.fatherId);
          queue.push(m.fatherId);
        }
        if (m.motherId && !linkedIds.has(m.motherId)) {
          linkedIds.add(m.motherId);
          queue.push(m.motherId);
        }
        // Down: children who point to this member as parent
        members.forEach(child => {
          if ((child.fatherId === id || child.motherId === id) && !linkedIds.has(child.id)) {
            linkedIds.add(child.id);
            queue.push(child.id);
          }
        });
      }
    }
    const unlinked = members.filter(m => !linkedIds.has(m.id));

    return {
      orphans: unlinked,
      stats: graph.getStats(),
      components: graph.getConnectedComponents(),
    };
  }, [members]);

  // On This Day
  const onThisDay = useMemo(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const suffix = `${mm}-${dd}`;
    const events = [];
    members.forEach(m => {
      if (m.dob && m.dob.substring(5) === suffix) {
        events.push({ member: m, type: 'birthday', label: `was born ${today.getFullYear() - new Date(m.dob).getFullYear()} years ago`, icon: '🎂' });
      }
      if (m.marriageDate && m.marriageDate.substring(5) === suffix) {
        const spouse = members.find(s => s.id === m.spouseId);
        events.push({ member: m, type: 'anniversary', label: `married ${spouse ? spouse.firstName : ''} ${today.getFullYear() - new Date(m.marriageDate).getFullYear()} years ago`, icon: '💍' });
      }
      if (m.dateOfDeath && m.dateOfDeath.substring(5) === suffix) {
        events.push({ member: m, type: 'death', label: `passed away ${today.getFullYear() - new Date(m.dateOfDeath).getFullYear()} years ago`, icon: '🪔' });
      }
    });
    return events;
  }, [members]);

  // Family Milestones
  const milestones = useMemo(() => {
    if (members.length === 0) return null;
    const allDobs = members.filter(m => m.dob).map(m => new Date(m.dob).getFullYear());
    const earliestYear = allDobs.length > 0 ? Math.min(...allDobs) : null;
    const spanYears = earliestYear ? new Date().getFullYear() - earliestYear : 0;
    const places = [...new Set(members.map(m => m.pob).filter(Boolean))];
    const gotrams = [...new Set(members.map(m => m.gotram).filter(Boolean))];
    const marriages = members.filter(m => m.marriageDate).length / 2;
    return { spanYears, earliestYear, places, gotrams, marriages, generations };
  }, [members, generations]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title font-display">Dashboard <span className="font-telugu text-lg text-saffron-400">ముఖ్యపుట</span></h1>
        </div>
        <Link to="/members/new" className="btn btn-primary">+ Add Member</Link>
      </div>

      {/* On This Day */}
      {onThisDay.length > 0 && (
        <div className="card bg-gradient-to-r from-saffron-50 to-amber-50 border-saffron-200 mb-6">
          <h3 className="text-sm font-semibold text-saffron-800 mb-3 flex items-center gap-2">
            📅 On This Day — {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
          </h3>
          <div className="space-y-2">
            {onThisDay.map((event, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/50 rounded-lg p-3">
                <span className="text-xl">{event.icon}</span>
                <p className="text-sm text-stone-700">
                  <Link to={`/members/${event.member.id}`} className="font-semibold hover:text-saffron-600">
                    {event.member.firstName} {event.member.lastName}
                  </Link>{' '}{event.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Members" value={members.length} color="text-saffron-600" />
        <StatCard label="Living" value={living.length} color="text-sacred-600" />
        <StatCard label="Generations" value={generations} color="text-blue-600" />
        <StatCard label="Gotrams" value={Object.keys(gotramMap).length} color="text-purple-600" />
      </div>

      {/* Connection Status */}
      {graphInfo.orphans.length > 0 && (
        <div className="card bg-amber-50/50 border-amber-200 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">🔗</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800 mb-1">
                {graphInfo.orphans.length} Unlinked Member{graphInfo.orphans.length > 1 ? 's' : ''}
              </h3>
              <p className="text-xs text-amber-600 mb-3">
                {graphInfo.stats.connectedComponents} separate cluster{graphInfo.stats.connectedComponents > 1 ? 's' : ''} detected.
                These members aren't connected to the main family tree — set their parent or spouse to link them.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {graphInfo.orphans.map(m => (
                  <Link
                    key={m.id}
                    to={`/members/${m.id}`}
                    className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full hover:bg-amber-200 transition font-medium"
                  >
                    {m.firstName} {m.lastName || ''}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Family Narrative */}
      {milestones && milestones.spanYears > 0 && (
        <div className="card bg-gradient-to-br from-stone-50 to-saffron-50/30 mb-6">
          <p className="text-sm text-stone-600 leading-relaxed">
            <span className="font-display font-semibold text-stone-800">Your family</span> spans{' '}
            <span className="font-bold text-saffron-700">{milestones.generations} generations</span> over{' '}
            <span className="font-bold text-saffron-700">{milestones.spanYears} years</span>{' '}
            (since {milestones.earliestYear}), with{' '}
            <span className="font-bold text-saffron-700">{members.length} members</span> across{' '}
            <span className="font-bold text-saffron-700">{milestones.places.length} places</span>
            {milestones.places.length > 0 && (
              <span className="text-stone-400"> ({milestones.places.slice(0, 4).join(', ')}{milestones.places.length > 4 ? '...' : ''})</span>
            )}.{' '}
            {milestones.gotrams.length > 1 && (
              <><span className="font-bold text-saffron-700">{milestones.gotrams.length} Gotrams</span> joined through{' '}
              <span className="font-bold text-saffron-700">{Math.round(milestones.marriages)} marriages</span>.</>
            )}
          </p>
        </div>
      )}

      {/* Quick Info + Completeness */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {oldest && (
          <div className="stat-card">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Eldest Living</p>
            <Link to={`/members/${oldest.id}`} className="font-semibold text-stone-800 hover:text-saffron-600">{oldest.firstName} {oldest.lastName}</Link>
            <p className="text-sm text-stone-500">{oldest.age} years old</p>
          </div>
        )}
        {youngest && (
          <div className="stat-card">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Youngest</p>
            <Link to={`/members/${youngest.id}`} className="font-semibold text-stone-800 hover:text-saffron-600">{youngest.firstName} {youngest.lastName}</Link>
            <p className="text-sm text-stone-500">{youngest.age} years old</p>
          </div>
        )}
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Deceased</p>
          <p className="font-semibold text-stone-800">{deceased.length} members</p>
          <Link to="/shraddha" className="text-sm text-saffron-600 hover:underline">Shraddha Calendar →</Link>
        </div>
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Data Completeness</p>
          <p className="font-semibold text-stone-800">{completeness.average}%</p>
          <div className="h-1.5 bg-stone-100 rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-saffron-500 rounded-full" style={{ width: `${completeness.average}%` }} />
          </div>
        </div>
      </div>

      {/* Birthdays & Anniversaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <Link to="/events?tab=birthdays" className="card-header flex items-center gap-2 hover:text-saffron-600 transition">
            🎂 Upcoming Birthdays
            <span className="ml-auto text-xs text-stone-400 font-normal">View all →</span>
          </Link>
          {upcomingBirthdays.length === 0 ? (
            <p className="text-sm text-stone-400">No birthdays in the next 60 days</p>
          ) : (
            <div className="space-y-3">
              {upcomingBirthdays.slice(0, 5).map(({ member, daysUntil, turnsAge }) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div>
                    <Link to={`/members/${member.id}`} className="font-medium text-stone-700 hover:text-saffron-600">{member.firstName} {member.lastName}</Link>
                    <p className="text-xs text-stone-400">Turns {turnsAge}</p>
                  </div>
                  <span className={`badge ${daysUntil === 0 ? 'bg-saffron-100 text-saffron-700' : 'bg-stone-100 text-stone-600'}`}>
                    {daysUntil === 0 ? 'Today!' : `${daysUntil}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <Link to="/events?tab=anniversaries" className="card-header flex items-center gap-2 hover:text-saffron-600 transition">
            💍 Upcoming Anniversaries
            <span className="ml-auto text-xs text-stone-400 font-normal">View all →</span>
          </Link>
          {upcomingAnniversaries.length === 0 ? (
            <p className="text-sm text-stone-400">No anniversaries in the next 60 days</p>
          ) : (
            <div className="space-y-3">
              {upcomingAnniversaries.slice(0, 5).map(({ member, spouse, daysUntil, years }) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-700">
                      <Link to={`/members/${member.id}`} className="hover:text-saffron-600">{member.firstName}</Link>
                      {' & '}
                      <Link to={`/members/${spouse.id}`} className="hover:text-saffron-600">{spouse.firstName}</Link>
                    </p>
                    <p className="text-xs text-stone-400">{years} years</p>
                  </div>
                  <span className={`badge ${daysUntil === 0 ? 'bg-pink-100 text-pink-700' : 'bg-stone-100 text-stone-600'}`}>
                    {daysUntil === 0 ? 'Today!' : `${daysUntil}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gotram Distribution */}
      {Object.keys(gotramMap).length > 0 && (
        <div className="card mb-6">
          <h3 className="card-header">Gotram Distribution</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(gotramMap).sort((a, b) => b[1] - a[1]).map(([gotram, count]) => (
              <div key={gotram} className="bg-saffron-50 rounded-lg px-4 py-2.5 border border-saffron-100">
                <p className="font-medium text-saffron-800">{gotram}</p>
                <p className="text-xs text-saffron-600">{count} members</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Shraddha */}
      {upcomingShraddhas.length > 0 && (
        <div className="card">
          <h3 className="card-header flex items-center gap-2">🪔 Upcoming Shraddha</h3>
          <div className="space-y-3">
            {upcomingShraddhas.map(entry => (
              <div key={entry.id} className="flex items-center justify-between">
                <div>
                  <Link to={`/members/${entry.id}`} className="font-medium text-stone-700 hover:text-saffron-600">{entry.firstName} {entry.lastName}</Link>
                  <p className="text-xs text-stone-400">{entry.deathPaksham} {entry.deathTithi} - {entry.deathMasam}</p>
                </div>
                <span className="badge bg-amber-50 text-amber-700">{entry.approxPeriod}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card text-center">
      <p className={`text-3xl font-bold font-display ${color}`}>{value}</p>
      <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}
