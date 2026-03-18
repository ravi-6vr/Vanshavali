/**
 * Pravara Recitation Generator
 * Generates the ritual Pravara text for Sankalpa in ceremonies
 */

import { getGotramDetails, GOTRAM_DATA } from '../data/vedic';

export default function PravaraGenerator({ gotram, firstName, lastName }) {
  if (!gotram) return null;

  const details = getGotramDetails(gotram);
  if (!details) return null;

  const pravaraCount = details.pravara.length;
  const pravaraWord = pravaraCount === 3 ? 'traya' : pravaraCount === 5 ? 'pancha' : pravaraCount === 7 ? 'sapta' : `${pravaraCount}`;

  // Generate Sanskrit-style recitation
  const pravaraText = details.pravara.join(', ');
  const recitation = `${pravaraText} ${pravaraWord} risheyah, ${gotram} gotrah, ${details.rishi} sharmanah / ${firstName || '___'} ${lastName || '___'}`;

  return (
    <div className="bg-gradient-to-br from-saffron-50 to-amber-50 rounded-lg p-5 border border-saffron-200">
      <h4 className="text-sm font-semibold text-saffron-800 mb-3 flex items-center gap-2">
        <span className="text-lg">🙏</span> Pravara (for Sankalpa / Rituals)
      </h4>

      {/* Rishi lineage visual */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {details.pravara.map((rishi, i) => (
          <div key={rishi} className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-white rounded-lg px-3 py-1.5 border border-saffron-200 shadow-sm">
              <p className="text-xs text-saffron-600 font-medium">{rishi}</p>
            </div>
            {i < details.pravara.length - 1 && (
              <span className="text-saffron-300">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Recitation text */}
      <div className="bg-white/60 rounded-lg p-3 border border-saffron-100">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Recitation</p>
        <p className="text-sm text-saffron-900 font-medium italic leading-relaxed">
          "{recitation}"
        </p>
      </div>

      {/* Details */}
      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-stone-400">Gotram</p>
          <p className="font-medium text-stone-700">{gotram}</p>
        </div>
        <div>
          <p className="text-stone-400">Rishi</p>
          <p className="font-medium text-stone-700">{details.rishi}</p>
        </div>
        <div>
          <p className="text-stone-400">Pravara Count</p>
          <p className="font-medium text-stone-700">{pravaraWord} ({pravaraCount})</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Gotra Compatibility Checker
 */
export function GotraCompatibility({ gotram1, gotram2, name1, name2 }) {
  if (!gotram1 || !gotram2) return null;

  const isSameGotra = gotram1.toLowerCase() === gotram2.toLowerCase();
  const details1 = getGotramDetails(gotram1);
  const details2 = getGotramDetails(gotram2);

  // Check if they share any Pravara Rishis
  const sharedRishis = details1 && details2
    ? details1.pravara.filter(r => details2.pravara.includes(r))
    : [];

  const isCompatible = !isSameGotra && sharedRishis.length === 0;

  return (
    <div className={`rounded-lg p-5 border ${
      isCompatible
        ? 'bg-green-50 border-green-200'
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{isCompatible ? '✅' : '⚠️'}</span>
        <div>
          <h4 className={`font-semibold ${isCompatible ? 'text-green-700' : 'text-red-700'}`}>
            {isCompatible ? 'Compatible' : 'Not Compatible'}
          </h4>
          <p className={`text-xs ${isCompatible ? 'text-green-600' : 'text-red-600'}`}>
            {isSameGotra
              ? 'Same Gotra — traditionally not compatible for marriage'
              : sharedRishis.length > 0
                ? `Shared Pravara Rishis: ${sharedRishis.join(', ')}`
                : 'Different Gotram and no shared Pravara Rishis'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/60 rounded-lg p-3">
          <p className="text-xs text-stone-400 mb-1">{name1 || 'Person 1'}</p>
          <p className="font-medium text-stone-700">{gotram1}</p>
          {details1 && <p className="text-xs text-stone-500 mt-1">Pravara: {details1.pravara.join(' → ')}</p>}
        </div>
        <div className="bg-white/60 rounded-lg p-3">
          <p className="text-xs text-stone-400 mb-1">{name2 || 'Person 2'}</p>
          <p className="font-medium text-stone-700">{gotram2}</p>
          {details2 && <p className="text-xs text-stone-500 mt-1">Pravara: {details2.pravara.join(' → ')}</p>}
        </div>
      </div>
    </div>
  );
}
