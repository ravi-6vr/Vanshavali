/**
 * Samskara Timeline — Visual tracker of the 16 Hindu Sacraments
 * Shows which Samskaras have been completed, with dates
 */

import { SAMSKARA_LIST } from '../data/vedic';

const STAGE_COLORS = {
  'Pre-birth': { bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-400', text: 'text-purple-700' },
  'Childhood': { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400', text: 'text-blue-700' },
  'Education': { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400', text: 'text-emerald-700' },
  'Adulthood': { bg: 'bg-saffron-50', border: 'border-saffron-200', dot: 'bg-saffron-400', text: 'text-saffron-700' },
  'Death': { bg: 'bg-stone-50', border: 'border-stone-200', dot: 'bg-stone-400', text: 'text-stone-700' },
};

export default function SamskaraTimeline({ samskaras = [], isDeceased = false, onEdit }) {
  // Build lookup of completed samskaras
  const completedMap = {};
  samskaras.forEach(s => { completedMap[s.name] = s; });

  const stages = [...new Set(SAMSKARA_LIST.map(s => s.stage))];
  const completedCount = samskaras.length;
  const totalRelevant = isDeceased ? 16 : 15; // Antyeshti only if deceased

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-saffron-400 to-saffron-600 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / totalRelevant) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-stone-500">
          {completedCount}/{totalRelevant}
        </span>
      </div>

      {/* Timeline by stage */}
      <div className="space-y-4">
        {stages.map(stage => {
          const stageItems = SAMSKARA_LIST.filter(s => s.stage === stage);
          const colors = STAGE_COLORS[stage];

          // Hide Antyeshti for living members
          if (stage === 'Death' && !isDeceased) return null;

          return (
            <div key={stage}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${colors.text}`}>
                {stage}
              </h4>
              <div className="space-y-1">
                {stageItems.map(samskara => {
                  const completed = completedMap[samskara.name];
                  const isComplete = !!completed;

                  return (
                    <div
                      key={samskara.name}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                        isComplete
                          ? `${colors.bg} ${colors.border}`
                          : 'bg-white border-stone-100 opacity-50'
                      }`}
                    >
                      {/* Status dot */}
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        isComplete ? colors.dot : 'bg-stone-200'
                      }`} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isComplete ? 'text-stone-700' : 'text-stone-400'}`}>
                          {samskara.name}
                        </p>
                        <p className="text-xs text-stone-400">{samskara.meaning}</p>
                      </div>

                      {/* Date or action */}
                      {isComplete && completed.date ? (
                        <span className="text-xs text-stone-500 flex-shrink-0">
                          {new Date(completed.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      ) : onEdit ? (
                        <button
                          onClick={() => onEdit(samskara.name)}
                          className="text-xs text-saffron-500 hover:text-saffron-700 flex-shrink-0"
                        >
                          + Add
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
