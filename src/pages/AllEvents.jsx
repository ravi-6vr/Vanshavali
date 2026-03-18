import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { calculateAge } from '../data/vedic';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function AllEvents() {
  const { members } = useFamily();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'birthdays';

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // All birthdays grouped by month (sorted starting from current month)
  const birthdaysByMonth = useMemo(() => {
    const byMonth = Array.from({ length: 12 }, () => []);

    members.forEach(member => {
      if (!member.dob || member.isDeceased) return;
      const birth = new Date(member.dob);
      const month = birth.getMonth();
      const thisYearBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      if (thisYearBday < today) thisYearBday.setFullYear(today.getFullYear() + 1);
      const daysUntil = Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
      const turnsAge = calculateAge(member.dob, thisYearBday);

      byMonth[month].push({ member, daysUntil, turnsAge, date: thisYearBday, day: birth.getDate() });
    });

    // Sort each month by day
    byMonth.forEach(list => list.sort((a, b) => a.day - b.day));

    // Reorder starting from current month
    const currentMonth = today.getMonth();
    const ordered = [];
    for (let i = 0; i < 12; i++) {
      const monthIdx = (currentMonth + i) % 12;
      if (byMonth[monthIdx].length > 0) {
        ordered.push({ month: MONTHS[monthIdx], monthIdx, entries: byMonth[monthIdx] });
      }
    }
    return ordered;
  }, [members, today]);

  // All anniversaries grouped by month
  const anniversariesByMonth = useMemo(() => {
    const byMonth = Array.from({ length: 12 }, () => []);

    members.forEach(member => {
      if (!member.marriageDate || !member.spouseId) return;
      const spouse = members.find(m => m.id === member.spouseId);
      if (!spouse) return;
      if (member.id > member.spouseId) return; // avoid duplicates

      const wedding = new Date(member.marriageDate);
      const month = wedding.getMonth();
      const thisYearAnni = new Date(today.getFullYear(), wedding.getMonth(), wedding.getDate());
      if (thisYearAnni < today) thisYearAnni.setFullYear(today.getFullYear() + 1);
      const daysUntil = Math.ceil((thisYearAnni - today) / (1000 * 60 * 60 * 24));
      const years = thisYearAnni.getFullYear() - wedding.getFullYear();

      byMonth[month].push({ member, spouse, daysUntil, years, date: thisYearAnni, day: wedding.getDate() });
    });

    byMonth.forEach(list => list.sort((a, b) => a.day - b.day));

    const currentMonth = today.getMonth();
    const ordered = [];
    for (let i = 0; i < 12; i++) {
      const monthIdx = (currentMonth + i) % 12;
      if (byMonth[monthIdx].length > 0) {
        ordered.push({ month: MONTHS[monthIdx], monthIdx, entries: byMonth[monthIdx] });
      }
    }
    return ordered;
  }, [members, today]);

  const totalBirthdays = birthdaysByMonth.reduce((s, g) => s + g.entries.length, 0);
  const totalAnniversaries = anniversariesByMonth.reduce((s, g) => s + g.entries.length, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-sm text-stone-400 hover:text-saffron-600 transition">← Back to Dashboard</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-stone-100 rounded-xl p-1">
        <Link
          to="/events?tab=birthdays"
          className={`flex-1 text-center py-2.5 px-4 rounded-lg text-sm font-medium transition ${
            tab === 'birthdays'
              ? 'bg-white text-saffron-700 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          🎂 Birthdays ({totalBirthdays})
        </Link>
        <Link
          to="/events?tab=anniversaries"
          className={`flex-1 text-center py-2.5 px-4 rounded-lg text-sm font-medium transition ${
            tab === 'anniversaries'
              ? 'bg-white text-saffron-700 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          💍 Anniversaries ({totalAnniversaries})
        </Link>
      </div>

      {/* Birthdays Tab */}
      {tab === 'birthdays' && (
        <>
          <h1 className="page-title mb-6">🎂 All Birthdays</h1>
          {birthdaysByMonth.length === 0 ? (
            <p className="text-stone-400 text-sm">No members have a date of birth set.</p>
          ) : (
            <div className="space-y-6">
              {birthdaysByMonth.map(group => (
                <div key={group.month} className="card">
                  <h3 className="card-header flex items-center gap-2">
                    {group.month}
                    <span className="text-xs text-stone-400 font-normal">({group.entries.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {group.entries.map(({ member, daysUntil, turnsAge, day }) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-stone-400 w-6 text-right">{day}</span>
                          <div>
                            <Link to={`/members/${member.id}`} className="font-medium text-stone-700 hover:text-saffron-600">
                              {member.firstName} {member.lastName}
                            </Link>
                            <p className="text-xs text-stone-400">Turns {turnsAge}</p>
                          </div>
                        </div>
                        <span className={`badge ${
                          daysUntil === 0 ? 'bg-saffron-100 text-saffron-700' :
                          daysUntil <= 7 ? 'bg-amber-50 text-amber-600' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {daysUntil === 0 ? 'Today!' : `${daysUntil}d`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Anniversaries Tab */}
      {tab === 'anniversaries' && (
        <>
          <h1 className="page-title mb-6">💍 All Anniversaries</h1>
          {anniversariesByMonth.length === 0 ? (
            <p className="text-stone-400 text-sm">No members have a marriage date set.</p>
          ) : (
            <div className="space-y-6">
              {anniversariesByMonth.map(group => (
                <div key={group.month} className="card">
                  <h3 className="card-header flex items-center gap-2">
                    {group.month}
                    <span className="text-xs text-stone-400 font-normal">({group.entries.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {group.entries.map(({ member, spouse, daysUntil, years, day }) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-stone-400 w-6 text-right">{day}</span>
                          <div>
                            <p className="font-medium text-stone-700">
                              <Link to={`/members/${member.id}`} className="hover:text-saffron-600">{member.firstName}</Link>
                              {' & '}
                              <Link to={`/members/${spouse.id}`} className="hover:text-saffron-600">{spouse.firstName}</Link>
                            </p>
                            <p className="text-xs text-stone-400">{years} years</p>
                          </div>
                        </div>
                        <span className={`badge ${
                          daysUntil === 0 ? 'bg-pink-100 text-pink-700' :
                          daysUntil <= 7 ? 'bg-amber-50 text-amber-600' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {daysUntil === 0 ? 'Today!' : `${daysUntil}d`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
