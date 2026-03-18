/**
 * Completeness Score Bar — Shows profile completeness with visual indicator
 */

import { Link } from 'react-router-dom';
import { calculateCompleteness } from '../utils/completeness';

export default function CompletenessBar({ member, showDetails = false }) {
  const score = calculateCompleteness(member);

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-stone-500">Profile Completeness</span>
            <span className={`text-sm font-bold ${score.color}`}>{score.percentage}%</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${score.bgColor}`}
              style={{ width: `${score.percentage}%` }}
            />
          </div>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${score.bgColor}`}>
          {score.grade}
        </div>
      </div>

      {showDetails && score.missing.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-stone-400 mb-2">Missing fields:</p>
          <div className="flex flex-wrap gap-1.5">
            {score.missing.slice(0, 8).map(field => (
              <span key={field.key} className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                {field.label}
              </span>
            ))}
            {score.missing.length > 8 && (
              <span className="text-xs text-stone-400">+{score.missing.length - 8} more</span>
            )}
          </div>
          <Link to={`/members/${member.id}/edit`} className="text-xs text-saffron-600 hover:underline mt-2 inline-block">
            Complete profile →
          </Link>
        </div>
      )}

      {showDetails && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <CategoryBar label="Personal" value={score.byCategory.personal} />
          <CategoryBar label="Vedic" value={score.byCategory.vedic} />
          <CategoryBar label="Family" value={score.byCategory.family} />
        </div>
      )}
    </div>
  );
}

function CategoryBar({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs text-stone-400">{label}</span>
        <span className="text-xs font-medium text-stone-500">{value}%</span>
      </div>
      <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-saffron-400 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
