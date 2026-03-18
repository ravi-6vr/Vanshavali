/**
 * Vedic Tools — Gotram, nakshatram, shraddha, and samskara lookups
 * for the Cultural/Samskara agent.
 */

import { GOTRAM_DATA, NAKSHATRAM_LIST, RAASI_LIST, SAMSKARA_LIST, MASAM_LIST, TITHI_LIST, PAKSHAM_LIST } from '../../data/vedic.js';

// ─── TOOL: get_vedic_profile ───────────────────────────────────────────────

export const getVedicProfile = {
  definition: {
    name: 'get_vedic_profile',
    description: 'Get the complete Vedic/astrological profile for a member: gotram, pravara, nakshatram, raasi, tithi, and samskaras.',
    parameters: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'The member ID' },
      },
      required: ['member_id'],
    },
  },
  createHandler: (db) => ({ member_id }) => {
    const row = db.prepare('SELECT data FROM members WHERE id = ?').get(member_id);
    if (!row) return { error: 'Member not found' };
    const m = JSON.parse(row.data);

    const gotramInfo = GOTRAM_DATA.find(g => g.name === m.gotram);
    const nakshatramInfo = NAKSHATRAM_LIST.find(n => n.name === m.nakshatram);

    return {
      name: `${m.firstName} ${m.lastName || ''}`.trim(),
      gotram: m.gotram || 'Not set',
      pravara: gotramInfo?.pravara || [],
      rishi: gotramInfo?.rishi || null,
      nakshatram: m.nakshatram || 'Not set',
      nakshatramDeity: nakshatramInfo?.deity || null,
      nakshatramSymbol: nakshatramInfo?.symbol || null,
      pada: m.pada || null,
      raasi: m.raasi || 'Not set',
      tithi: m.tithi || null,
      masam: m.masam || null,
      paksham: m.paksham || null,
      samskaras: m.samskaras || [],
    };
  },
};

// ─── TOOL: check_gotra_compatibility ───────────────────────────────────────

export const checkGotraCompatibility = {
  definition: {
    name: 'check_gotra_compatibility',
    description: 'Check if two members have compatible gotrams for marriage. Same gotram means they share a common rishi lineage and traditionally cannot marry.',
    parameters: {
      type: 'object',
      properties: {
        member_id_1: { type: 'string', description: 'First member ID' },
        member_id_2: { type: 'string', description: 'Second member ID' },
      },
      required: ['member_id_1', 'member_id_2'],
    },
  },
  createHandler: (db) => ({ member_id_1, member_id_2 }) => {
    const row1 = db.prepare('SELECT data FROM members WHERE id = ?').get(member_id_1);
    const row2 = db.prepare('SELECT data FROM members WHERE id = ?').get(member_id_2);
    if (!row1 || !row2) return { error: 'One or both members not found' };

    const m1 = JSON.parse(row1.data);
    const m2 = JSON.parse(row2.data);

    const g1 = m1.gotram, g2 = m2.gotram;
    if (!g1 || !g2) return { compatible: null, reason: 'Gotram not set for one or both members' };

    const gotram1 = GOTRAM_DATA.find(g => g.name === g1);
    const gotram2 = GOTRAM_DATA.find(g => g.name === g2);

    const sameGotram = g1 === g2;
    // Also check if they share any pravara rishis
    const sharedPravara = gotram1 && gotram2
      ? gotram1.pravara.filter(p => gotram2.pravara.includes(p))
      : [];

    return {
      member1: { name: `${m1.firstName} ${m1.lastName || ''}`.trim(), gotram: g1, pravara: gotram1?.pravara || [] },
      member2: { name: `${m2.firstName} ${m2.lastName || ''}`.trim(), gotram: g2, pravara: gotram2?.pravara || [] },
      sameGotram,
      sharedPravara,
      compatible: !sameGotram && sharedPravara.length === 0,
      reason: sameGotram
        ? `Both belong to ${g1} gotram — same gotra marriage is traditionally not permitted`
        : sharedPravara.length > 0
          ? `Different gotrams but share pravara rishi(s): ${sharedPravara.join(', ')} — may not be compatible`
          : `${g1} and ${g2} are different gotrams with no shared pravara — compatible`,
    };
  },
};

// ─── TOOL: get_shraddha_dates ──────────────────────────────────────────────

export const getShraddha = {
  definition: {
    name: 'get_shraddha_dates',
    description: 'Get shraddha (death anniversary) information for deceased family members. Returns the Vedic lunar date details (tithi, masam, paksham) used to observe the annual death anniversary.',
    parameters: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Optional: get shraddha for a specific deceased member. If omitted, returns all deceased members with shraddha data.' },
      },
    },
  },
  createHandler: (db) => ({ member_id } = {}) => {
    const rows = db.prepare('SELECT data FROM members').all();
    const members = rows.map(r => JSON.parse(r.data));
    const deceased = members.filter(m => m.isDeceased);

    if (member_id) {
      const member = deceased.find(m => m.id === member_id);
      if (!member) return { error: 'Member not found or not deceased' };
      return {
        name: `${member.firstName} ${member.lastName || ''}`.trim(),
        dateOfDeath: member.dateOfDeath,
        deathTithi: member.deathTithi || 'Not recorded',
        deathMasam: member.deathMasam || 'Not recorded',
        deathPaksham: member.deathPaksham || 'Not recorded',
      };
    }

    return deceased.map(m => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName || ''}`.trim(),
      dateOfDeath: m.dateOfDeath,
      deathTithi: m.deathTithi || 'Not recorded',
      deathMasam: m.deathMasam || 'Not recorded',
      deathPaksham: m.deathPaksham || 'Not recorded',
    }));
  },
};

// ─── TOOL: explain_samskara ────────────────────────────────────────────────

export const explainSamskara = {
  definition: {
    name: 'explain_samskara',
    description: 'Explain a Hindu samskara (life ceremony) — what it is, its meaning, and which stage of life it belongs to. Also lists which family members have completed it.',
    parameters: {
      type: 'object',
      properties: {
        samskara_name: { type: 'string', description: 'Name of the samskara (e.g., "Upanayana", "Vivaha", "Namakarana")' },
      },
      required: ['samskara_name'],
    },
  },
  createHandler: (db) => ({ samskara_name }) => {
    const samskara = SAMSKARA_LIST.find(s =>
      s.name.toLowerCase() === samskara_name.toLowerCase()
    );

    if (!samskara) {
      return {
        error: `Unknown samskara: ${samskara_name}`,
        available: SAMSKARA_LIST.map(s => s.name),
      };
    }

    // Find members who have this samskara
    const rows = db.prepare('SELECT data FROM members').all();
    const members = rows.map(r => JSON.parse(r.data));
    const completed = members
      .filter(m => (m.samskaras || []).some(s => s.name === samskara.name))
      .map(m => {
        const s = m.samskaras.find(s => s.name === samskara.name);
        return {
          name: `${m.firstName} ${m.lastName || ''}`.trim(),
          date: s.date || 'Unknown',
          notes: s.notes || '',
        };
      });

    return {
      name: samskara.name,
      meaning: samskara.meaning,
      stage: samskara.stage,
      completedBy: completed,
    };
  },
};
