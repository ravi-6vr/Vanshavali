/**
 * Data Completeness Score Calculator
 * Calculates how complete each member's profile is
 */

const FIELDS = [
  { key: 'firstName', label: 'First Name', weight: 10, category: 'personal' },
  { key: 'lastName', label: 'Last Name', weight: 5, category: 'personal' },
  { key: 'gender', label: 'Gender', weight: 8, category: 'personal' },
  { key: 'dob', label: 'Date of Birth', weight: 8, category: 'personal' },
  { key: 'tob', label: 'Time of Birth', weight: 3, category: 'personal' },
  { key: 'pob', label: 'Place of Birth', weight: 5, category: 'personal' },
  { key: 'nakshatram', label: 'Nakshatram', weight: 7, category: 'vedic' },
  { key: 'pada', label: 'Pada', weight: 5, category: 'vedic' },
  { key: 'raasi', label: 'Raasi', weight: 5, category: 'vedic' },
  { key: 'gotram', label: 'Gotram', weight: 8, category: 'vedic' },
  { key: 'tithi', label: 'Tithi', weight: 3, category: 'vedic' },
  { key: 'masam', label: 'Masam', weight: 3, category: 'vedic' },
  { key: 'paksham', label: 'Paksham', weight: 2, category: 'vedic' },
  { key: 'fatherId', label: 'Father', weight: 8, category: 'family' },
  { key: 'motherId', label: 'Mother', weight: 8, category: 'family' },
];

export function calculateCompleteness(member) {
  let earned = 0;
  let total = 0;
  const missing = [];
  const byCategory = { personal: { earned: 0, total: 0 }, vedic: { earned: 0, total: 0 }, family: { earned: 0, total: 0 } };

  FIELDS.forEach(field => {
    total += field.weight;
    byCategory[field.category].total += field.weight;

    const value = member[field.key];
    const hasValue = value !== null && value !== undefined && value !== '';

    if (hasValue) {
      earned += field.weight;
      byCategory[field.category].earned += field.weight;
    } else {
      missing.push(field);
    }
  });

  const percentage = Math.round((earned / total) * 100);

  return {
    percentage,
    earned,
    total,
    missing,
    byCategory: {
      personal: Math.round((byCategory.personal.earned / byCategory.personal.total) * 100),
      vedic: Math.round((byCategory.vedic.earned / byCategory.vedic.total) * 100),
      family: Math.round((byCategory.family.earned / byCategory.family.total) * 100),
    },
    grade: percentage >= 90 ? 'A' : percentage >= 70 ? 'B' : percentage >= 50 ? 'C' : percentage >= 30 ? 'D' : 'F',
    color: percentage >= 90 ? 'text-green-600' : percentage >= 70 ? 'text-blue-600' : percentage >= 50 ? 'text-yellow-600' : percentage >= 30 ? 'text-orange-600' : 'text-red-600',
    bgColor: percentage >= 90 ? 'bg-green-500' : percentage >= 70 ? 'bg-blue-500' : percentage >= 50 ? 'bg-yellow-500' : percentage >= 30 ? 'bg-orange-500' : 'bg-red-500',
  };
}

export function getOverallCompleteness(members) {
  if (members.length === 0) return { average: 0, distribution: {} };
  const scores = members.map(m => calculateCompleteness(m));
  const average = Math.round(scores.reduce((s, c) => s + c.percentage, 0) / scores.length);
  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  scores.forEach(s => distribution[s.grade]++);
  return { average, distribution, scores };
}
