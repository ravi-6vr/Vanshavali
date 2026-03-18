/**
 * DB Tools — Direct database query tools for LLM agents.
 * Handles stories, photos, health records, and cross-cutting queries.
 */

// ─── TOOL: get_stories ─────────────────────────────────────────────────────

export const getStories = {
  definition: {
    name: 'get_stories',
    description: 'Get family stories. Optionally filter by member ID to get stories that mention a specific person.',
    parameters: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Optional: filter stories mentioning this member' },
      },
    },
  },
  createHandler: (db) => ({ member_id } = {}) => {
    const rows = db.prepare('SELECT * FROM stories ORDER BY updated_at DESC').all();
    const stories = rows.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content,
      memberIds: JSON.parse(r.member_ids),
      tags: JSON.parse(r.tags),
    }));

    if (member_id) {
      return stories.filter(s => s.memberIds.includes(member_id));
    }
    return stories;
  },
};

// ─── TOOL: get_health_records ──────────────────────────────────────────────

export const getHealthRecords = {
  definition: {
    name: 'get_health_records',
    description: 'Get health records for a specific member or all members with health conditions.',
    parameters: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Optional: get health records for a specific member. If omitted, returns all members with health data.' },
      },
    },
  },
  createHandler: (db) => ({ member_id } = {}) => {
    const rows = db.prepare('SELECT data FROM members').all();
    const members = rows.map(r => JSON.parse(r.data));

    if (member_id) {
      const member = members.find(m => m.id === member_id);
      if (!member) return { error: 'Member not found' };
      return {
        name: `${member.firstName} ${member.lastName || ''}`.trim(),
        health: member.health || [],
      };
    }

    // Return all members who have health records
    return members
      .filter(m => m.health && m.health.length > 0)
      .map(m => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName || ''}`.trim(),
        health: m.health,
      }));
  },
};

// ─── TOOL: trace_lineage_health ────────────────────────────────────────────

export const traceLineageHealth = {
  definition: {
    name: 'trace_lineage_health',
    description: 'Trace health conditions along a member\'s ancestral lines (both paternal and maternal). Identifies hereditary health patterns.',
    parameters: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'The member whose ancestral health to trace' },
      },
      required: ['member_id'],
    },
  },
  createHandler: (db) => ({ member_id }) => {
    const rows = db.prepare('SELECT data FROM members').all();
    const members = rows.map(r => JSON.parse(r.data));
    const byId = new Map(members.map(m => [m.id, m]));

    const member = byId.get(member_id);
    if (!member) return { error: 'Member not found' };

    // Trace paternal line
    const paternal = [];
    let current = member.fatherId ? byId.get(member.fatherId) : null;
    while (current) {
      if (current.health?.length > 0) {
        paternal.push({
          name: `${current.firstName} ${current.lastName || ''}`.trim(),
          relationship: paternal.length === 0 ? 'Father' : `${paternal.length + 1}x Great-Grandfather`,
          conditions: current.health,
        });
      }
      current = current.fatherId ? byId.get(current.fatherId) : null;
    }

    // Trace maternal line
    const maternal = [];
    current = member.motherId ? byId.get(member.motherId) : null;
    while (current) {
      if (current.health?.length > 0) {
        maternal.push({
          name: `${current.firstName} ${current.lastName || ''}`.trim(),
          relationship: maternal.length === 0 ? 'Mother' : `${maternal.length + 1}x Great-Grandmother`,
          conditions: current.health,
        });
      }
      current = current.motherId ? byId.get(current.motherId) : null;
    }

    // Collect unique conditions
    const allConditions = [...paternal, ...maternal]
      .flatMap(p => p.conditions.map(c => c.condition))
      .filter(Boolean);
    const uniqueConditions = [...new Set(allConditions)];

    return {
      member: `${member.firstName} ${member.lastName || ''}`.trim(),
      paternalLineHealth: paternal,
      maternalLineHealth: maternal,
      hereditaryRisks: uniqueConditions,
    };
  },
};

// ─── TOOL: get_migration_history ───────────────────────────────────────────

export const getMigrationHistory = {
  definition: {
    name: 'get_migration_history',
    description: 'Get migration/location history for a member or all members. Shows places lived with dates and coordinates.',
    parameters: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Optional: get locations for a specific member. If omitted, returns all members with location data.' },
      },
    },
  },
  createHandler: (db) => ({ member_id } = {}) => {
    const rows = db.prepare('SELECT data FROM members').all();
    const members = rows.map(r => JSON.parse(r.data));

    if (member_id) {
      const member = members.find(m => m.id === member_id);
      if (!member) return { error: 'Member not found' };
      return {
        name: `${member.firstName} ${member.lastName || ''}`.trim(),
        locations: member.locations || [],
      };
    }

    return members
      .filter(m => m.locations && m.locations.length > 0)
      .map(m => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName || ''}`.trim(),
        locations: m.locations,
      }));
  },
};

// ─── TOOL: get_members_by_place ────────────────────────────────────────────

export const getMembersByPlace = {
  definition: {
    name: 'get_members_by_place',
    description: 'Find all family members who lived in or were born in a specific place.',
    parameters: {
      type: 'object',
      properties: {
        place: { type: 'string', description: 'Place name to search for (e.g., "Hyderabad", "Rajahmundry")' },
      },
      required: ['place'],
    },
  },
  createHandler: (db) => ({ place }) => {
    const rows = db.prepare('SELECT data FROM members').all();
    const members = rows.map(r => JSON.parse(r.data));
    const q = place.toLowerCase();

    return members
      .filter(m => {
        const pob = (m.pob || '').toLowerCase();
        const locs = (m.locations || []).some(l => l.place.toLowerCase().includes(q));
        return pob.includes(q) || locs;
      })
      .map(m => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName || ''}`.trim(),
        pob: m.pob,
        locations: (m.locations || []).filter(l => l.place.toLowerCase().includes(q)),
      }));
  },
};
