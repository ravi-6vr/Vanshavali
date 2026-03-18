/**
 * Shraddha Calendar - Calculate annual death anniversary dates
 * Based on Tithi (lunar day) + Masam (lunar month) of death
 *
 * Note: Exact Panchanga calculation requires complex astronomical algorithms.
 * This provides approximate dates. For precise dates, a Panchanga API would be ideal.
 */

import { MASAM_LIST, TITHI_LIST } from '../data/vedic.js';

/**
 * Get all deceased members with their Shraddha details
 */
export function getShraddhaEntries(members) {
  return members
    .filter(m => m.isDeceased)
    .map(member => {
      const hasLunarInfo = member.deathTithi && member.deathMasam;
      return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        dateOfDeath: member.dateOfDeath,
        deathTithi: member.deathTithi || '',
        deathMasam: member.deathMasam || '',
        deathPaksham: member.deathPaksham || '',
        hasLunarInfo,
        gotram: member.gotram || '',
      };
    })
    .sort((a, b) => {
      // Sort by Masam order, then Tithi order
      const mA = MASAM_LIST.indexOf(a.deathMasam);
      const mB = MASAM_LIST.indexOf(b.deathMasam);
      if (mA !== mB) return mA - mB;
      const tA = TITHI_LIST.indexOf(a.deathTithi);
      const tB = TITHI_LIST.indexOf(b.deathTithi);
      return tA - tB;
    });
}

/**
 * Approximate Gregorian month range for each lunar month
 * This is a rough mapping — actual dates vary each year by ~15 days
 */
const MASAM_TO_GREGORIAN = {
  'Chaitra': { month: 3, approxStart: 'Mar-Apr' },
  'Vaishakha': { month: 4, approxStart: 'Apr-May' },
  'Jyeshtha': { month: 5, approxStart: 'May-Jun' },
  'Ashadha': { month: 6, approxStart: 'Jun-Jul' },
  'Shravana': { month: 7, approxStart: 'Jul-Aug' },
  'Bhadrapada': { month: 8, approxStart: 'Aug-Sep' },
  'Ashwin': { month: 9, approxStart: 'Sep-Oct' },
  'Kartika': { month: 10, approxStart: 'Oct-Nov' },
  'Margashirsha': { month: 11, approxStart: 'Nov-Dec' },
  'Pausha': { month: 12, approxStart: 'Dec-Jan' },
  'Magha': { month: 1, approxStart: 'Jan-Feb' },
  'Phalguna': { month: 2, approxStart: 'Feb-Mar' },
};

/**
 * Get approximate Gregorian period for a Shraddha
 */
export function getApproximatePeriod(masam) {
  const mapping = MASAM_TO_GREGORIAN[masam];
  return mapping ? mapping.approxStart : 'Unknown';
}

/**
 * Group Shraddha entries by Masam for calendar view
 */
export function groupByMasam(entries) {
  const grouped = {};
  MASAM_LIST.forEach(masam => {
    grouped[masam] = entries.filter(e => e.deathMasam === masam);
  });
  return grouped;
}

/**
 * Get entries that are upcoming (approximate, based on current month)
 */
export function getUpcomingShraddhas(entries) {
  const currentMonth = new Date().getMonth(); // 0-based
  const upcoming = [];

  entries.forEach(entry => {
    if (!entry.deathMasam) return;
    const mapping = MASAM_TO_GREGORIAN[entry.deathMasam];
    if (!mapping) return;

    // Check if the lunar month roughly corresponds to current or next 2 months
    const lunarMonth = mapping.month;
    const diff = (lunarMonth - currentMonth + 12) % 12;
    if (diff <= 2) {
      upcoming.push({
        ...entry,
        approxPeriod: mapping.approxStart,
        isThisMonth: diff === 0,
      });
    }
  });

  return upcoming;
}
