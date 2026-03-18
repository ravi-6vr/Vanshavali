/**
 * Graph Tools — Wraps FamilyGraph methods as LLM-callable tool definitions.
 *
 * Each export has { definition, createHandler(db) } where:
 * - definition: OpenAI function-calling schema
 * - createHandler: returns an async function that executes the tool
 */

import { FamilyGraph } from '../../utils/FamilyGraph.js';

/** Helper: build graph from DB */
function buildGraph(db) {
  const rows = db.prepare('SELECT data FROM members').all();
  const members = rows.map(r => JSON.parse(r.data));
  return { graph: new FamilyGraph(members), members };
}

/** Helper: fuzzy search members by name */
function searchByName(members, query) {
  const q = query.toLowerCase().trim();
  return members.filter(m => {
    const full = `${m.firstName} ${m.lastName || ''}`.toLowerCase();
    return full.includes(q);
  });
}

/** Helper: summarize a member for LLM context */
function summarizeMember(m) {
  return {
    id: m.id,
    name: `${m.firstName} ${m.lastName || ''}`.trim(),
    gender: m.gender,
    dob: m.dob || null,
    isDeceased: m.isDeceased || false,
    gotram: m.gotram || null,
    pob: m.pob || null,
  };
}

// ─── TOOL: search_members ──────────────────────────────────────────────────

export const searchMembers = {
  definition: {
    name: 'search_members',
    description: 'Search family members by name. Returns matching members with basic info.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Name or partial name to search for' },
      },
      required: ['query'],
    },
  },
  createHandler: (db) => ({ query }) => {
    const { members } = buildGraph(db);
    const matches = searchByName(members, query);
    return matches.map(summarizeMember);
  },
};

// ─── TOOL: get_member_profile ──────────────────────────────────────────────

export const getMemberProfile = {
  definition: {
    name: 'get_member_profile',
    description: 'Get full profile of a family member by ID. Includes all personal details, vedic info, relationships, health, journey events, samskaras, and locations.',
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
    return {
      ...summarizeMember(m),
      tob: m.tob, pob: m.pob,
      nakshatram: m.nakshatram, pada: m.pada, raasi: m.raasi,
      tithi: m.tithi, masam: m.masam, paksham: m.paksham,
      gotram: m.gotram,
      marriageDate: m.marriageDate,
      dateOfDeath: m.dateOfDeath,
      deathTithi: m.deathTithi, deathMasam: m.deathMasam, deathPaksham: m.deathPaksham,
      health: m.health || [],
      journeyEvents: m.journeyEvents || [],
      samskaras: m.samskaras || [],
      locations: m.locations || [],
      memories: m.memories || [],
      fatherId: m.fatherId, motherId: m.motherId, spouseId: m.spouseId,
      childrenIds: m.childrenIds || [],
    };
  },
};

// ─── TOOL: find_relationship ───────────────────────────────────────────────

export const findRelationship = {
  definition: {
    name: 'find_relationship',
    description: 'Find the relationship between two family members. Returns the relationship term in English, Telugu, and Hindi, along with the path and generation gap.',
    parameters: {
      type: 'object',
      properties: {
        from_id: { type: 'string', description: 'ID of the first member (perspective: "from this person...")' },
        to_id: { type: 'string', description: 'ID of the second member ("...to this person")' },
      },
      required: ['from_id', 'to_id'],
    },
  },
  createHandler: (db) => ({ from_id, to_id }) => {
    const { graph } = buildGraph(db);
    const result = graph.findRelationship(from_id, to_id);
    return {
      relationship: result.terms?.en || result.description,
      telugu: result.terms?.te || null,
      hindi: result.terms?.hi || null,
      generationGap: result.generation,
      steps: result.steps,
      pathDescription: result.pathDescription,
    };
  },
};

// ─── TOOL: get_ancestors ───────────────────────────────────────────────────

export const getAncestors = {
  definition: {
    name: 'get_ancestors',
    description: 'Get all ancestors of a member up to N generations. Returns ancestors with their generation number.',
    parameters: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'The member ID' },
        max_generations: { type: 'number', description: 'Max generations to trace back (default: 10)' },
      },
      required: ['member_id'],
    },
  },
  createHandler: (db) => ({ member_id, max_generations = 10 }) => {
    const { graph } = buildGraph(db);
    const ancestors = graph.getAncestors(member_id, max_generations);
    return ancestors.map(a => ({
      ...summarizeMember(a.member),
      generation: a.generation,
    }));
  },
};

// ─── TOOL: get_descendants ─────────────────────────────────────────────────

export const getDescendants = {
  definition: {
    name: 'get_descendants',
    description: 'Get all descendants of a member up to N generations.',
    parameters: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'The member ID' },
        max_generations: { type: 'number', description: 'Max generations to trace forward (default: 10)' },
      },
      required: ['member_id'],
    },
  },
  createHandler: (db) => ({ member_id, max_generations = 10 }) => {
    const { graph } = buildGraph(db);
    const descendants = graph.getDescendants(member_id, max_generations);
    return descendants.map(d => ({
      ...summarizeMember(d.member),
      generation: d.generation,
    }));
  },
};

// ─── TOOL: get_family_stats ────────────────────────────────────────────────

export const getFamilyStats = {
  definition: {
    name: 'get_family_stats',
    description: 'Get overall family tree statistics: total members, generations, connected components, root ancestors.',
    parameters: { type: 'object', properties: {} },
  },
  createHandler: (db) => () => {
    const { graph } = buildGraph(db);
    const stats = graph.getStats();
    return {
      totalMembers: stats.totalMembers,
      connectedComponents: stats.connectedComponents,
      maxGenerationDepth: stats.maxGenerationDepth,
      rootAncestors: stats.rootAncestors.map(summarizeMember),
    };
  },
};

// ─── TOOL: get_siblings ────────────────────────────────────────────────────

export const getSiblings = {
  definition: {
    name: 'get_siblings',
    description: 'Get all siblings of a member (full, half, and step siblings).',
    parameters: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'The member ID' },
      },
      required: ['member_id'],
    },
  },
  createHandler: (db) => ({ member_id }) => {
    const { graph } = buildGraph(db);
    const siblings = graph.getSiblings(member_id);
    return siblings.map(s => ({
      ...summarizeMember(s.member),
      siblingType: s.type,
    }));
  },
};

// ─── TOOL: list_all_members ────────────────────────────────────────────────

export const listAllMembers = {
  definition: {
    name: 'list_all_members',
    description: 'List all family members with basic info. Use this to get an overview of the entire family.',
    parameters: { type: 'object', properties: {} },
  },
  createHandler: (db) => () => {
    const { members } = buildGraph(db);
    return members.map(summarizeMember);
  },
};
