import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { getShraddhaEntries, groupByMasam, getApproximatePeriod, getUpcomingShraddhas } from '../utils/shraddha';
import { MASAM_LIST } from '../data/vedic';

export default function ShraddhaCalendar() {
  const { members } = useFamily();

  const entries = useMemo(() => getShraddhaEntries(members), [members]);
  const grouped = useMemo(() => groupByMasam(entries), [entries]);
  const upcoming = useMemo(() => getUpcomingShraddhas(entries), [entries]);

  const entriesWithLunar = entries.filter(e => e.hasLunarInfo);
  const entriesWithoutLunar = entries.filter(e => !e.hasLunarInfo);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Shraddha Calendar</h1>
        <p className="text-stone-500 text-sm mt-1">
          Annual death anniversary (Shraddha/Tithi) dates for deceased family members.
          Based on the lunar Tithi and Masam of passing.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">🪔</p>
          <p className="text-lg">No deceased members recorded</p>
        </div>
      ) : (
        <>
          {/* Upcoming Alert */}
          {upcoming.length > 0 && (
            <div className="card bg-amber-50 border-amber-200 mb-6">
              <h3 className="text-lg font-semibold text-amber-800 mb-3">Upcoming Shraddha</h3>
              <div className="space-y-3">
                {upcoming.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                    <div>
                      <Link to={`/members/${entry.id}`} className="font-semibold text-stone-800 hover:text-saffron-600">
                        {entry.firstName} {entry.lastName}
                      </Link>
                      <p className="text-sm text-stone-500">
                        {entry.deathPaksham} {entry.deathTithi}, {entry.deathMasam}
                      </p>
                      {entry.gotram && <p className="text-xs text-stone-400">Gotram: {entry.gotram}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`badge ${entry.isThisMonth ? 'bg-amber-200 text-amber-800' : 'bg-amber-100 text-amber-700'}`}>
                        {entry.approxPeriod}
                      </span>
                      {entry.isThisMonth && <p className="text-xs text-amber-600 mt-1 font-medium">This month</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar by Masam */}
          <div className="card mb-6">
            <h3 className="card-header">By Lunar Month (Masam)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MASAM_LIST.map(masam => {
                const monthEntries = grouped[masam];
                if (!monthEntries || monthEntries.length === 0) return null;
                return (
                  <div key={masam} className="bg-stone-50 rounded-lg p-4 border border-stone-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-stone-700">{masam}</h4>
                      <span className="text-xs text-stone-400">{getApproximatePeriod(masam)}</span>
                    </div>
                    <div className="space-y-2">
                      {monthEntries.map(entry => (
                        <div key={entry.id} className="text-sm">
                          <Link to={`/members/${entry.id}`} className="font-medium text-stone-700 hover:text-saffron-600">
                            {entry.firstName} {entry.lastName}
                          </Link>
                          <p className="text-xs text-stone-400">
                            {entry.deathPaksham} {entry.deathTithi}
                            {entry.gotram && ` | ${entry.gotram}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Deceased List */}
          <div className="card mb-6">
            <h3 className="card-header">All Deceased Members ({entries.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-2 px-3 text-xs text-stone-400 font-medium uppercase">Name</th>
                    <th className="text-left py-2 px-3 text-xs text-stone-400 font-medium uppercase">Date of Death</th>
                    <th className="text-left py-2 px-3 text-xs text-stone-400 font-medium uppercase">Tithi</th>
                    <th className="text-left py-2 px-3 text-xs text-stone-400 font-medium uppercase">Masam</th>
                    <th className="text-left py-2 px-3 text-xs text-stone-400 font-medium uppercase">Gotram</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="py-2.5 px-3">
                        <Link to={`/members/${entry.id}`} className="font-medium text-stone-700 hover:text-saffron-600">
                          {entry.firstName} {entry.lastName}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-stone-500">
                        {entry.dateOfDeath ? new Date(entry.dateOfDeath).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-stone-500">
                        {entry.deathPaksham} {entry.deathTithi || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-stone-500">{entry.deathMasam || '-'}</td>
                      <td className="py-2.5 px-3 text-stone-500">{entry.gotram || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Members without lunar info */}
          {entriesWithoutLunar.length > 0 && (
            <div className="card bg-red-50 border-red-200">
              <h3 className="text-sm font-semibold text-red-700 mb-2">
                Missing Shraddha Details ({entriesWithoutLunar.length})
              </h3>
              <p className="text-xs text-red-600 mb-3">
                These deceased members don't have Tithi/Masam information needed for Shraddha calculation.
              </p>
              <div className="space-y-1">
                {entriesWithoutLunar.map(entry => (
                  <Link key={entry.id} to={`/members/${entry.id}/edit`}
                    className="block text-sm text-red-700 hover:text-red-900 hover:underline">
                    {entry.firstName} {entry.lastName} — Add details →
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
