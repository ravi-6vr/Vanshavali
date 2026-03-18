import { useMemo } from 'react';
import { useFamily } from '../context/FamilyContext';
import { calculateAge } from '../data/vedic';
import { NAKSHATRAM_LIST, RAASI_LIST } from '../data/vedic';
import { calculateCompleteness } from '../utils/completeness';

const AGE_BUCKETS = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '90+'];

const SEGMENT_COLORS = [
  'bg-saffron-500', 'bg-sacred-500', 'bg-blue-500', 'bg-purple-500',
  'bg-temple-500', 'bg-amber-500', 'bg-teal-500', 'bg-rose-500',
  'bg-indigo-500', 'bg-emerald-500', 'bg-orange-500', 'bg-cyan-500',
  'bg-fuchsia-500', 'bg-lime-500', 'bg-sky-500', 'bg-violet-500',
];

function getDecade(dateStr) {
  if (!dateStr) return null;
  const year = new Date(dateStr).getFullYear();
  return Math.floor(year / 10) * 10;
}

export default function Analytics() {
  const { members } = useFamily();

  // === DEMOGRAPHICS ===
  const demographics = useMemo(() => {
    const male = members.filter(m => m.gender === 'Male').length;
    const female = members.filter(m => m.gender === 'Female').length;
    const other = members.length - male - female;
    const living = members.filter(m => !m.isDeceased);
    const deceased = members.filter(m => m.isDeceased);

    // Age distribution
    const ageBuckets = {};
    AGE_BUCKETS.forEach(b => { ageBuckets[b] = 0; });
    living.forEach(m => {
      const age = calculateAge(m.dob);
      if (age === null) return;
      if (age > 90) ageBuckets['90+']++;
      else {
        const idx = Math.floor(age / 10);
        const key = AGE_BUCKETS[idx] || '90+';
        ageBuckets[key]++;
      }
    });
    const maxAgeBucket = Math.max(1, ...Object.values(ageBuckets));

    // Average age of living
    const livingAges = living.map(m => calculateAge(m.dob)).filter(a => a !== null);
    const avgLivingAge = livingAges.length > 0
      ? Math.round(livingAges.reduce((s, a) => s + a, 0) / livingAges.length)
      : null;

    // Average lifespan of deceased
    const deceasedLifespans = deceased.map(m => {
      if (!m.dob || !m.dateOfDeath) return null;
      return calculateAge(m.dob, new Date(m.dateOfDeath));
    }).filter(a => a !== null);
    const avgLifespan = deceasedLifespans.length > 0
      ? Math.round(deceasedLifespans.reduce((s, a) => s + a, 0) / deceasedLifespans.length)
      : null;

    return { male, female, other, living: living.length, deceased: deceased.length, ageBuckets, maxAgeBucket, avgLivingAge, avgLifespan };
  }, [members]);

  // === GEOGRAPHIC SPREAD ===
  const geography = useMemo(() => {
    const placeMap = {};
    members.forEach(m => {
      if (m.pob) {
        const place = m.pob.trim();
        placeMap[place] = (placeMap[place] || 0) + 1;
      }
    });
    const sorted = Object.entries(placeMap).sort((a, b) => b[1] - a[1]);
    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
    return { places: sorted, maxCount };
  }, [members]);

  // === VEDIC DISTRIBUTION ===
  const vedic = useMemo(() => {
    // Gotram
    const gotramMap = {};
    members.forEach(m => {
      if (m.gotram) gotramMap[m.gotram] = (gotramMap[m.gotram] || 0) + 1;
    });
    const gotramEntries = Object.entries(gotramMap).sort((a, b) => b[1] - a[1]);
    const gotramTotal = gotramEntries.reduce((s, [, c]) => s + c, 0);

    // Nakshatram
    const nakMap = {};
    NAKSHATRAM_LIST.forEach(n => { nakMap[n.name] = 0; });
    members.forEach(m => {
      if (m.nakshatram && nakMap[m.nakshatram] !== undefined) {
        nakMap[m.nakshatram]++;
      }
    });

    // Raasi
    const raasiMap = {};
    RAASI_LIST.forEach(r => { raasiMap[r.name] = 0; });
    members.forEach(m => {
      if (m.raasi && raasiMap[m.raasi] !== undefined) {
        raasiMap[m.raasi]++;
      }
    });
    const raasiEntries = Object.entries(raasiMap).sort((a, b) => b[1] - a[1]);
    const mostCommonRaasi = raasiEntries.find(([, c]) => c > 0);

    return { gotramEntries, gotramTotal, nakMap, mostCommonRaasi };
  }, [members]);

  // === FAMILY STRUCTURE ===
  const familyStructure = useMemo(() => {
    // Parents and children
    const parentChildCount = {};
    members.forEach(m => {
      const children = m.childrenIds || [];
      if (children.length > 0) {
        parentChildCount[m.id] = children.length;
      }
    });
    const parentCounts = Object.values(parentChildCount);
    const avgChildren = parentCounts.length > 0
      ? (parentCounts.reduce((s, c) => s + c, 0) / parentCounts.length).toFixed(1)
      : '0';

    // Largest families
    const largestFamilies = Object.entries(parentChildCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const parent = members.find(m => m.id === id);
        return { parent, count };
      })
      .filter(f => f.parent);

    // Marriage stats
    const married = members.filter(m => m.spouseId);
    const marriedPct = members.length > 0
      ? Math.round((married.length / members.length) * 100)
      : 0;

    const marriageAges = married.map(m => {
      if (!m.dob || !m.marriageDate) return null;
      return calculateAge(m.dob, new Date(m.marriageDate));
    }).filter(a => a !== null && a > 0);
    const avgMarriageAge = marriageAges.length > 0
      ? Math.round(marriageAges.reduce((s, a) => s + a, 0) / marriageAges.length)
      : null;

    // Orphans
    const orphans = members.filter(m => !m.fatherId && !m.motherId);

    return { avgChildren, largestFamilies, marriedPct, avgMarriageAge, orphanCount: orphans.length };
  }, [members]);

  // === TIMELINE INSIGHTS ===
  const timeline = useMemo(() => {
    const birthDecades = {};
    const marriageDecades = {};

    members.forEach(m => {
      const bd = getDecade(m.dob);
      if (bd) birthDecades[bd] = (birthDecades[bd] || 0) + 1;

      const md = getDecade(m.marriageDate);
      if (md) marriageDecades[md] = (marriageDecades[md] || 0) + 1;
    });

    // All decades for consistent range
    const allDecades = new Set([...Object.keys(birthDecades), ...Object.keys(marriageDecades)]);
    const sortedDecades = [...allDecades].map(Number).sort((a, b) => a - b);

    // Cumulative growth
    const cumulativeGrowth = [];
    let cumulative = 0;
    sortedDecades.forEach(d => {
      cumulative += (birthDecades[d] || 0);
      cumulativeGrowth.push({ decade: d, count: cumulative });
    });

    const maxBirth = Math.max(1, ...Object.values(birthDecades));
    const maxMarriage = Math.max(1, ...Object.values(marriageDecades));
    const maxCumulative = cumulativeGrowth.length > 0 ? cumulativeGrowth[cumulativeGrowth.length - 1].count : 1;

    return { birthDecades, marriageDecades, sortedDecades, cumulativeGrowth, maxBirth, maxMarriage, maxCumulative };
  }, [members]);

  // === COMPLETENESS ===
  const completeness = useMemo(() => {
    if (members.length === 0) return { top5: [], bottom5: [], overallScore: 0 };

    const scored = members.map(m => ({
      member: m,
      score: calculateCompleteness(m),
    }));

    scored.sort((a, b) => b.score.percentage - a.score.percentage);
    const top5 = scored.slice(0, 5);
    const bottom5 = scored.slice(-5).reverse();
    const overallScore = Math.round(scored.reduce((s, c) => s + c.score.percentage, 0) / scored.length);

    return { top5, bottom5, overallScore };
  }, [members]);

  if (members.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="page-title font-telugu text-3xl">విశ్లేషణ</h1>
          <p className="text-stone-500 text-sm mt-1">Family Analytics & Insights</p>
        </div>
        <div className="card text-center py-12">
          <p className="text-stone-400 text-lg">No members found. Add family members to see analytics.</p>
        </div>
      </div>
    );
  }

  const total = members.length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title font-telugu text-3xl">విశ్లేషణ</h1>
        <p className="text-stone-500 text-sm mt-1">Family Analytics & Insights</p>
      </div>

      {/* Section 1: Demographics */}
      <div className="card mb-6">
        <h2 className="card-header font-telugu">జనాభా వివరాలు — Demographics</h2>

        {/* Gender Distribution */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-stone-600 mb-2 uppercase tracking-wider">Gender Distribution</h3>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-stone-500 w-16">Male</span>
            <div className="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${total ? (demographics.male / total) * 100 : 0}%`, minWidth: demographics.male > 0 ? '2rem' : 0 }}>
                <span className="text-xs text-white font-medium">{demographics.male}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-stone-500 w-16">Female</span>
            <div className="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-temple-500 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${total ? (demographics.female / total) * 100 : 0}%`, minWidth: demographics.female > 0 ? '2rem' : 0 }}>
                <span className="text-xs text-white font-medium">{demographics.female}</span>
              </div>
            </div>
          </div>
          {demographics.other > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-stone-500 w-16">Other</span>
              <div className="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${(demographics.other / total) * 100}%`, minWidth: '2rem' }}>
                  <span className="text-xs text-white font-medium">{demographics.other}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Age Distribution */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-stone-600 mb-2 uppercase tracking-wider">Age Distribution (Living)</h3>
          <div className="space-y-1.5">
            {AGE_BUCKETS.map(bucket => (
              <div key={bucket} className="flex items-center gap-3">
                <span className="text-xs text-stone-500 w-10 text-right font-mono">{bucket}</span>
                <div className="flex-1 h-5 bg-stone-100 rounded overflow-hidden">
                  <div className="h-full bg-saffron-400 rounded transition-all"
                    style={{ width: `${(demographics.ageBuckets[bucket] / demographics.maxAgeBucket) * 100}%` }}>
                  </div>
                </div>
                <span className="text-xs text-stone-500 w-6 text-right">{demographics.ageBuckets[bucket] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Living vs Deceased */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-stone-600 mb-2 uppercase tracking-wider">Living vs Deceased</h3>
          <div className="h-8 bg-stone-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-sacred-500 flex items-center justify-center"
              style={{ width: `${total ? (demographics.living / total) * 100 : 0}%` }}>
              {demographics.living > 0 && <span className="text-xs text-white font-medium">Living: {demographics.living}</span>}
            </div>
            <div className="h-full bg-stone-400 flex items-center justify-center"
              style={{ width: `${total ? (demographics.deceased / total) * 100 : 0}%` }}>
              {demographics.deceased > 0 && <span className="text-xs text-white font-medium">Deceased: {demographics.deceased}</span>}
            </div>
          </div>
        </div>

        {/* Averages */}
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card text-center">
            <p className="text-2xl font-bold font-display text-sacred-600">{demographics.avgLivingAge ?? '—'}</p>
            <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Avg Age (Living)</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold font-display text-stone-600">{demographics.avgLifespan ?? '—'}</p>
            <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Avg Lifespan (Deceased)</p>
          </div>
        </div>
      </div>

      {/* Section 2: Geographic Spread */}
      <div className="card mb-6">
        <h2 className="card-header font-telugu">భౌగోళిక విస్తరణ — Geographic Spread</h2>
        {geography.places.length === 0 ? (
          <p className="text-sm text-stone-400">No birth places recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {geography.places.map(([place, count]) => (
              <div key={place} className="flex items-center gap-3">
                <span className="text-sm text-stone-700 w-40 truncate" title={place}>{place}</span>
                <div className="flex-1 h-5 bg-stone-100 rounded overflow-hidden">
                  <div className="h-full bg-blue-400 rounded transition-all"
                    style={{ width: `${(count / geography.maxCount) * 100}%` }}>
                  </div>
                </div>
                <span className="text-xs text-stone-500 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Vedic Distribution */}
      <div className="card mb-6">
        <h2 className="card-header font-telugu">వైదిక వివరాలు — Vedic Distribution</h2>

        {/* Gotram Distribution */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-stone-600 mb-2 uppercase tracking-wider">Gotram Distribution</h3>
          {vedic.gotramEntries.length === 0 ? (
            <p className="text-sm text-stone-400">No gotram data available.</p>
          ) : (
            <>
              <div className="h-8 rounded-full overflow-hidden flex mb-3">
                {vedic.gotramEntries.map(([gotram, count], i) => (
                  <div key={gotram}
                    className={`h-full ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]} flex items-center justify-center`}
                    style={{ width: `${(count / vedic.gotramTotal) * 100}%` }}
                    title={`${gotram}: ${count}`}>
                    {(count / vedic.gotramTotal) > 0.1 && (
                      <span className="text-xs text-white font-medium truncate px-1">{gotram}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {vedic.gotramEntries.map(([gotram, count], i) => (
                  <span key={gotram} className="badge bg-stone-100 text-stone-700 gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`}></span>
                    {gotram}: {count}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Nakshatram Distribution */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-stone-600 mb-3 uppercase tracking-wider">Nakshatram Distribution (27)</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
            {NAKSHATRAM_LIST.map(nak => {
              const count = vedic.nakMap[nak.name] || 0;
              return (
                <div key={nak.name}
                  className={`rounded-lg p-2 text-center border ${count > 0 ? 'bg-saffron-50 border-saffron-200' : 'bg-stone-50 border-stone-100'}`}>
                  <p className="text-xs font-medium text-stone-700 truncate" title={nak.name}>
                    {nak.name}
                  </p>
                  <p className={`text-lg font-bold ${count > 0 ? 'text-saffron-600' : 'text-stone-300'}`}>{count}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Common Raasi */}
        <div>
          <h3 className="text-sm font-semibold text-stone-600 mb-2 uppercase tracking-wider">Most Common Raasi</h3>
          {vedic.mostCommonRaasi ? (
            <div className="flex items-center gap-3">
              <span className="badge bg-purple-100 text-purple-700 text-sm px-4 py-1.5">
                {vedic.mostCommonRaasi[0]}
              </span>
              <span className="text-sm text-stone-500">{vedic.mostCommonRaasi[1]} member{vedic.mostCommonRaasi[1] !== 1 ? 's' : ''}</span>
              <span className="text-xs text-stone-400">
                ({RAASI_LIST.find(r => r.name === vedic.mostCommonRaasi[0])?.english || ''})
              </span>
            </div>
          ) : (
            <p className="text-sm text-stone-400">No raasi data available.</p>
          )}
        </div>
      </div>

      {/* Section 4: Family Structure */}
      <div className="card mb-6">
        <h2 className="card-header font-telugu">కుటుంబ నిర్మాణం — Family Structure</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card text-center">
            <p className="text-2xl font-bold font-display text-saffron-600">{familyStructure.avgChildren}</p>
            <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Avg Children/Parent</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold font-display text-temple-600">{familyStructure.marriedPct}%</p>
            <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Married</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold font-display text-blue-600">{familyStructure.avgMarriageAge ?? '—'}</p>
            <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Avg Marriage Age</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold font-display text-purple-600">{familyStructure.orphanCount}</p>
            <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Root Members</p>
          </div>
        </div>

        {/* Largest Families */}
        {familyStructure.largestFamilies.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-stone-600 mb-2 uppercase tracking-wider">Largest Families</h3>
            <div className="space-y-2">
              {familyStructure.largestFamilies.map(({ parent, count }) => (
                <div key={parent.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-4 py-2.5">
                  <span className="text-sm font-medium text-stone-700">{parent.firstName} {parent.lastName}</span>
                  <span className="badge bg-saffron-100 text-saffron-700">{count} children</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 5: Timeline Insights */}
      <div className="card mb-6">
        <h2 className="card-header font-telugu">కాలరేఖ — Timeline Insights</h2>

        {timeline.sortedDecades.length === 0 ? (
          <p className="text-sm text-stone-400">No date data available for timeline analysis.</p>
        ) : (
          <>
            {/* Births by Decade */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-stone-600 mb-2 uppercase tracking-wider">Births by Decade</h3>
              <div className="space-y-1.5">
                {timeline.sortedDecades.map(decade => (
                  <div key={`b-${decade}`} className="flex items-center gap-3">
                    <span className="text-xs text-stone-500 w-12 text-right font-mono">{decade}s</span>
                    <div className="flex-1 h-5 bg-stone-100 rounded overflow-hidden">
                      <div className="h-full bg-sacred-400 rounded transition-all"
                        style={{ width: `${((timeline.birthDecades[decade] || 0) / timeline.maxBirth) * 100}%` }}>
                      </div>
                    </div>
                    <span className="text-xs text-stone-500 w-6 text-right">{timeline.birthDecades[decade] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Marriages by Decade */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-stone-600 mb-2 uppercase tracking-wider">Marriages by Decade</h3>
              <div className="space-y-1.5">
                {timeline.sortedDecades.map(decade => (
                  <div key={`m-${decade}`} className="flex items-center gap-3">
                    <span className="text-xs text-stone-500 w-12 text-right font-mono">{decade}s</span>
                    <div className="flex-1 h-5 bg-stone-100 rounded overflow-hidden">
                      <div className="h-full bg-temple-400 rounded transition-all"
                        style={{ width: `${((timeline.marriageDecades[decade] || 0) / timeline.maxMarriage) * 100}%` }}>
                      </div>
                    </div>
                    <span className="text-xs text-stone-500 w-6 text-right">{timeline.marriageDecades[decade] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cumulative Growth */}
            <div>
              <h3 className="text-sm font-semibold text-stone-600 mb-2 uppercase tracking-wider">Family Growth Over Time</h3>
              <div className="space-y-1.5">
                {timeline.cumulativeGrowth.map(({ decade, count }) => (
                  <div key={`g-${decade}`} className="flex items-center gap-3">
                    <span className="text-xs text-stone-500 w-12 text-right font-mono">{decade}s</span>
                    <div className="flex-1 h-5 bg-stone-100 rounded overflow-hidden">
                      <div className="h-full bg-blue-400 rounded transition-all"
                        style={{ width: `${(count / timeline.maxCumulative) * 100}%` }}>
                      </div>
                    </div>
                    <span className="text-xs text-stone-500 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Section 6: Completeness Leaderboard */}
      <div className="card mb-6">
        <h2 className="card-header font-telugu">సంపూర్ణత — Data Completeness</h2>

        {/* Overall Score */}
        <div className="stat-card text-center mb-6">
          <p className="text-4xl font-bold font-display text-saffron-600">{completeness.overallScore}%</p>
          <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Overall Family Data Completeness</p>
          <div className="h-2 bg-stone-100 rounded-full mt-3 overflow-hidden max-w-xs mx-auto">
            <div className="h-full bg-saffron-500 rounded-full transition-all" style={{ width: `${completeness.overallScore}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top 5 */}
          <div>
            <h3 className="text-sm font-semibold text-sacred-600 mb-3 uppercase tracking-wider">Top 5 Most Complete</h3>
            <div className="space-y-2">
              {completeness.top5.map(({ member, score }, i) => (
                <div key={member.id} className="flex items-center gap-3 bg-sacred-50/50 rounded-lg px-4 py-2.5">
                  <span className="text-xs font-bold text-sacred-600 w-5">#{i + 1}</span>
                  <span className="text-sm font-medium text-stone-700 flex-1">{member.firstName} {member.lastName}</span>
                  <div className="w-20 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${score.bgColor}`} style={{ width: `${score.percentage}%` }} />
                  </div>
                  <span className={`text-xs font-bold ${score.color} w-10 text-right`}>{score.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom 5 */}
          <div>
            <h3 className="text-sm font-semibold text-red-500 mb-3 uppercase tracking-wider">Bottom 5 — Needs Attention</h3>
            <div className="space-y-2">
              {completeness.bottom5.map(({ member, score }, i) => (
                <div key={member.id} className="flex items-center gap-3 bg-red-50/50 rounded-lg px-4 py-2.5">
                  <span className="text-xs font-bold text-red-400 w-5">#{members.length - i}</span>
                  <span className="text-sm font-medium text-stone-700 flex-1">{member.firstName} {member.lastName}</span>
                  <div className="w-20 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${score.bgColor}`} style={{ width: `${score.percentage}%` }} />
                  </div>
                  <span className={`text-xs font-bold ${score.color} w-10 text-right`}>{score.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
