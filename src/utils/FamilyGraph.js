/**
 * FamilyGraph — Modular, conditional, and dynamic family relationship graph
 *
 * Replaces ad-hoc graph building with a proper graph class that supports:
 * - Typed edges (biological, adoptive, step, guardian, spouse, former_spouse)
 * - Conditional connectivity (edges with metadata, active/inactive states)
 * - Rich queries (ancestors, descendants, lineage, generations, common ancestors)
 * - Connected component analysis (detect orphan clusters)
 * - Improved relationship resolution with 50+ Indian relationship terms
 */

// ─── Edge Types ────────────────────────────────────────────────────────────────

export const EdgeType = {
  // Parent-child (directional: from parent → child)
  BIOLOGICAL_PARENT: 'biological_parent',
  ADOPTIVE_PARENT: 'adoptive_parent',
  STEP_PARENT: 'step_parent',
  GUARDIAN: 'guardian',

  // Spousal (bidirectional)
  SPOUSE: 'spouse',
  FORMER_SPOUSE: 'former_spouse',

  // Derived (computed, not stored)
  SIBLING: 'sibling',
  HALF_SIBLING: 'half_sibling',
  STEP_SIBLING: 'step_sibling',
};

const PARENT_EDGE_TYPES = [
  EdgeType.BIOLOGICAL_PARENT,
  EdgeType.ADOPTIVE_PARENT,
  EdgeType.STEP_PARENT,
  EdgeType.GUARDIAN,
];

// ─── Edge Class ────────────────────────────────────────────────────────────────

class Edge {
  constructor(fromId, toId, type, metadata = {}) {
    this.fromId = fromId;
    this.toId = toId;
    this.type = type;
    this.startDate = metadata.startDate || null;   // When this relationship began
    this.endDate = metadata.endDate || null;        // When it ended (null = ongoing)
    this.isActive = metadata.isActive !== false;    // Active by default
    this.notes = metadata.notes || '';
  }

  /** Is this edge currently active? */
  get active() {
    if (!this.isActive) return false;
    if (this.endDate) {
      return new Date(this.endDate) > new Date();
    }
    return true;
  }
}

// ─── Relationship Terms ────────────────────────────────────────────────────────

const RELATIONSHIP_TERMS = {
  // Direct
  father:               { te: 'నాన్న (Nanna)', hi: 'Pitaji', en: 'Father' },
  mother:               { te: 'అమ్మ (Amma)', hi: 'Maa', en: 'Mother' },
  son:                  { te: 'కొడుకు (Koduku)', hi: 'Beta', en: 'Son' },
  daughter:             { te: 'కూతురు (Kuthuru)', hi: 'Beti', en: 'Daughter' },
  husband:              { te: 'భర్త (Bharta)', hi: 'Pati', en: 'Husband' },
  wife:                 { te: 'భార్య (Bharya)', hi: 'Patni', en: 'Wife' },

  // Siblings
  elder_brother:        { te: 'అన్నయ్య (Annayya)', hi: 'Bhaiya', en: 'Elder Brother' },
  younger_brother:      { te: 'తమ్ముడు (Thammudu)', hi: 'Chhota Bhai', en: 'Younger Brother' },
  elder_sister:         { te: 'అక్క (Akka)', hi: 'Didi', en: 'Elder Sister' },
  younger_sister:       { te: 'చెల్లి (Chelli)', hi: 'Chhoti Behan', en: 'Younger Sister' },

  // Grandparents
  paternal_grandfather: { te: 'తాతయ్య (Thathayya)', hi: 'Dadaji', en: 'Paternal Grandfather' },
  paternal_grandmother: { te: 'నాన్నమ్మ (Nannamma)', hi: 'Dadiji', en: 'Paternal Grandmother' },
  maternal_grandfather: { te: 'తాతయ్య (Amma side)', hi: 'Nanaji', en: 'Maternal Grandfather' },
  maternal_grandmother: { te: 'అమ్మమ్మ (Ammamma)', hi: 'Naniji', en: 'Maternal Grandmother' },

  // Grandchildren
  grandson:             { te: 'మనవడు (Manavaadu)', hi: 'Pota', en: 'Grandson' },
  granddaughter:        { te: 'మనవరాలు (Manavaralu)', hi: 'Poti', en: 'Granddaughter' },

  // Great-grandparents / great-grandchildren
  great_grandfather:    { te: 'ముత్తాతయ్య (Muththathayya)', hi: 'Par-Dadaji', en: 'Great-Grandfather' },
  great_grandmother:    { te: 'ముత్తమ్మ (Muththamma)', hi: 'Par-Dadiji', en: 'Great-Grandmother' },
  great_grandson:       { te: 'మునిమనవడు (Munimanavaadu)', hi: 'Par-Pota', en: 'Great-Grandson' },
  great_granddaughter:  { te: 'మునిమనవరాలు (Munimanavaralu)', hi: 'Par-Poti', en: 'Great-Granddaughter' },

  // Uncles & Aunts (paternal)
  paternal_uncle_elder: { te: 'పెదనాన్న (Pedananna)', hi: 'Tauji', en: 'Father\'s Elder Brother' },
  paternal_uncle_younger: { te: 'బాబాయి (Babai)', hi: 'Chacha', en: 'Father\'s Younger Brother' },
  paternal_aunt:        { te: 'అత్త (Attha)', hi: 'Bua', en: 'Father\'s Sister' },

  // Uncles & Aunts (maternal)
  maternal_uncle:       { te: 'మామయ్య (Mavayya)', hi: 'Mama', en: 'Mother\'s Brother' },
  maternal_aunt_elder:  { te: 'పెద్దమ్మ (Peddamma)', hi: 'Mausi (elder)', en: 'Mother\'s Elder Sister' },
  maternal_aunt_younger:{ te: 'పిన్ని (Pinni)', hi: 'Mausi (younger)', en: 'Mother\'s Younger Sister' },

  // Uncle/Aunt spouses
  paternal_uncle_wife:  { te: 'పిన్ని / పెద్దమ్మ', hi: 'Chachi / Taiji', en: 'Paternal Uncle\'s Wife' },
  paternal_aunt_husband:{ te: 'మామయ్య (Attha side)', hi: 'Phupha', en: 'Paternal Aunt\'s Husband' },
  maternal_uncle_wife:  { te: 'అత్త (Mama side)', hi: 'Mami', en: 'Maternal Uncle\'s Wife' },
  maternal_aunt_husband:{ te: 'మేనమామ', hi: 'Mausa', en: 'Maternal Aunt\'s Husband' },

  // In-laws
  father_in_law:        { te: 'మామయ్య (Mamayya)', hi: 'Sasurji', en: 'Father-in-law' },
  mother_in_law:        { te: 'అత్తమ్మ (Atthamma)', hi: 'Sasuji', en: 'Mother-in-law' },
  son_in_law:           { te: 'అల్లుడు (Alludu)', hi: 'Damaad', en: 'Son-in-law' },
  daughter_in_law:      { te: 'కోడలు (Kodalu)', hi: 'Bahu', en: 'Daughter-in-law' },
  brother_in_law:       { te: 'బావ (Baava)', hi: 'Jija / Devar', en: 'Brother-in-law' },
  sister_in_law:        { te: 'వదిన / మరదలు', hi: 'Bhabhi / Nanad', en: 'Sister-in-law' },

  // Cousins
  cousin_brother:       { te: 'బావ / అన్న (Cousin)', hi: 'Cousin Bhai', en: 'Cousin (Male)' },
  cousin_sister:        { te: 'వదిన / మరదలు (Cousin)', hi: 'Cousin Behan', en: 'Cousin (Female)' },

  // Nephew / Niece
  nephew:               { te: 'మేనల్లుడు (Menalludu)', hi: 'Bhatija', en: 'Nephew' },
  niece:                { te: 'మేనకోడలు (Menakodalu)', hi: 'Bhatiji', en: 'Niece' },

  // Adoptive / Step
  adoptive_father:      { te: 'పెంపుడు నాన్న', hi: 'Palak Pita', en: 'Adoptive Father' },
  adoptive_mother:      { te: 'పెంపుడు అమ్మ', hi: 'Palak Mata', en: 'Adoptive Mother' },
  step_father:          { te: 'సవతి తండ్రి', hi: 'Sautela Pita', en: 'Step-Father' },
  step_mother:          { te: 'సవతి తల్లి', hi: 'Sauteli Maa', en: 'Step-Mother' },
  step_brother:         { te: 'సవతి సోదరుడు', hi: 'Sautela Bhai', en: 'Step-Brother' },
  step_sister:          { te: 'సవతి సోదరి', hi: 'Sauteli Behan', en: 'Step-Sister' },
  half_brother:         { te: 'సగం సోదరుడు', hi: 'Sautela Bhai', en: 'Half-Brother' },
  half_sister:          { te: 'సగం సోదరి', hi: 'Sauteli Behan', en: 'Half-Sister' },

  // Generic fallbacks
  relative:             { te: 'బంధువు (Bandhuvu)', hi: 'Rishtedar', en: 'Relative' },
  self:                 { te: 'నేను (Nenu)', hi: 'Main', en: 'Self' },
};

// ─── FamilyGraph Class ─────────────────────────────────────────────────────────

export class FamilyGraph {
  constructor(members = []) {
    /** @type {Map<string, object>} id → member data */
    this.nodes = new Map();
    /** @type {Map<string, Edge[]>} id → outgoing edges */
    this.adjacency = new Map();
    /** @type {Edge[]} all edges */
    this.edges = [];

    if (members.length > 0) {
      this.buildFromMembers(members);
    }
  }

  // ─── Graph Construction ──────────────────────────────────────────────────

  /** Build the graph from a flat array of member objects */
  buildFromMembers(members) {
    this.nodes.clear();
    this.adjacency.clear();
    this.edges = [];

    // Register all nodes
    for (const m of members) {
      this.nodes.set(m.id, m);
      this.adjacency.set(m.id, []);
    }

    // Build edges from member relationships
    for (const m of members) {
      // Father → child (biological by default)
      if (m.fatherId && this.nodes.has(m.fatherId)) {
        const edgeType = m.relationToFather || EdgeType.BIOLOGICAL_PARENT;
        this._addEdgePair(m.fatherId, m.id, edgeType, {
          startDate: m.dob || null,
        });
      }

      // Mother → child
      if (m.motherId && this.nodes.has(m.motherId)) {
        const edgeType = m.relationToMother || EdgeType.BIOLOGICAL_PARENT;
        this._addEdgePair(m.motherId, m.id, edgeType, {
          startDate: m.dob || null,
        });
      }

      // Spouse
      if (m.spouseId && this.nodes.has(m.spouseId)) {
        // Avoid duplicate spouse edges (A→B and B→A)
        const existing = this.edges.find(
          e => e.type === EdgeType.SPOUSE &&
            ((e.fromId === m.id && e.toId === m.spouseId) ||
             (e.fromId === m.spouseId && e.toId === m.id))
        );
        if (!existing) {
          this._addEdgeBidirectional(m.id, m.spouseId, EdgeType.SPOUSE, {
            startDate: m.marriageDate || null,
          });
        }
      }
    }

    return this;
  }

  /** Add a directed parent→child edge pair (parent→child as "parent", child→parent as traversal) */
  _addEdgePair(parentId, childId, type, metadata = {}) {
    const parentEdge = new Edge(parentId, childId, type, metadata);
    const childEdge = new Edge(childId, parentId, `child_of_${type}`, metadata);
    this.edges.push(parentEdge, childEdge);
    this.adjacency.get(parentId)?.push(parentEdge);
    this.adjacency.get(childId)?.push(childEdge);
  }

  /** Add a bidirectional edge (e.g., spouse) */
  _addEdgeBidirectional(id1, id2, type, metadata = {}) {
    const edge1 = new Edge(id1, id2, type, metadata);
    const edge2 = new Edge(id2, id1, type, metadata);
    this.edges.push(edge1, edge2);
    this.adjacency.get(id1)?.push(edge1);
    this.adjacency.get(id2)?.push(edge2);
  }

  /** Dynamically add a relationship edge */
  addEdge(fromId, toId, type, metadata = {}) {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) return null;

    if (type === EdgeType.SPOUSE || type === EdgeType.FORMER_SPOUSE) {
      this._addEdgeBidirectional(fromId, toId, type, metadata);
    } else if (PARENT_EDGE_TYPES.includes(type)) {
      this._addEdgePair(fromId, toId, type, metadata);
    }
    return this;
  }

  /** Remove edges between two nodes of a given type */
  removeEdge(fromId, toId, type) {
    this.edges = this.edges.filter(e =>
      !((e.fromId === fromId && e.toId === toId && e.type === type) ||
        (e.fromId === toId && e.toId === fromId && e.type === type))
    );
    // Rebuild adjacency for affected nodes
    for (const id of [fromId, toId]) {
      if (this.adjacency.has(id)) {
        this.adjacency.set(id, this.edges.filter(e => e.fromId === id));
      }
    }
    return this;
  }

  /** Deactivate an edge (soft delete — keeps history) */
  deactivateEdge(fromId, toId, type, endDate = new Date().toISOString()) {
    for (const e of this.edges) {
      if ((e.fromId === fromId && e.toId === toId && e.type === type) ||
          (e.fromId === toId && e.toId === fromId && e.type === type)) {
        e.isActive = false;
        e.endDate = endDate;
      }
    }
    return this;
  }

  // ─── Node Queries ────────────────────────────────────────────────────────

  /** Get a member by ID */
  getMember(id) {
    return this.nodes.get(id) || null;
  }

  /** Get all active edges from a node, optionally filtered by type */
  getEdges(id, type = null, activeOnly = true) {
    const edges = this.adjacency.get(id) || [];
    return edges.filter(e =>
      (!type || e.type === type) &&
      (!activeOnly || e.active)
    );
  }

  /** Get parents of a member (biological, adoptive, step, guardian) */
  getParents(id, options = {}) {
    const { type = null, activeOnly = true } = options;
    const parentEdgeTypes = type ? [`child_of_${type}`] :
      PARENT_EDGE_TYPES.map(t => `child_of_${t}`);

    return this.getEdges(id, null, activeOnly)
      .filter(e => parentEdgeTypes.includes(e.type))
      .map(e => this.nodes.get(e.toId))
      .filter(Boolean);
  }

  /** Get biological parents specifically */
  getBiologicalParents(id) {
    return this.getParents(id, { type: EdgeType.BIOLOGICAL_PARENT });
  }

  /** Get children of a member */
  getChildren(id, options = {}) {
    const { type = null, activeOnly = true } = options;
    const parentEdgeTypes = type ? [type] : PARENT_EDGE_TYPES;

    return this.getEdges(id, null, activeOnly)
      .filter(e => parentEdgeTypes.includes(e.type))
      .map(e => this.nodes.get(e.toId))
      .filter(Boolean);
  }

  /** Get spouse(s) — supports multiple (former spouses) */
  getSpouses(id, includeFormer = false) {
    const types = [EdgeType.SPOUSE];
    if (includeFormer) types.push(EdgeType.FORMER_SPOUSE);

    return this.getEdges(id, null, !includeFormer)
      .filter(e => types.includes(e.type))
      .map(e => ({ member: this.nodes.get(e.toId), edge: e }))
      .filter(r => r.member);
  }

  /** Get siblings (share at least one biological parent) */
  getSiblings(id) {
    const parents = this.getBiologicalParents(id);
    const siblingIds = new Set();
    const result = [];

    for (const parent of parents) {
      const children = this.getChildren(parent.id, { type: EdgeType.BIOLOGICAL_PARENT });
      for (const child of children) {
        if (child.id !== id && !siblingIds.has(child.id)) {
          siblingIds.add(child.id);
          // Determine sibling type
          const childParents = this.getBiologicalParents(child.id);
          const sharedParents = childParents.filter(p => parents.some(pp => pp.id === p.id));
          const siblingType = sharedParents.length === parents.length && sharedParents.length === childParents.length
            ? 'full' : 'half';
          result.push({ member: child, type: siblingType });
        }
      }
    }

    // Step-siblings: children of step-parents
    const stepParents = this.getParents(id, { type: EdgeType.STEP_PARENT });
    for (const stepParent of stepParents) {
      const children = this.getChildren(stepParent.id);
      for (const child of children) {
        if (child.id !== id && !siblingIds.has(child.id)) {
          siblingIds.add(child.id);
          result.push({ member: child, type: 'step' });
        }
      }
    }

    return result;
  }

  // ─── Lineage & Ancestry ──────────────────────────────────────────────────

  /** Get all ancestors up to N generations (BFS) */
  getAncestors(id, maxGenerations = Infinity) {
    const ancestors = [];
    const visited = new Set([id]);
    let queue = [{ id, generation: 0 }];

    while (queue.length > 0) {
      const { id: currentId, generation } = queue.shift();
      if (generation >= maxGenerations) continue;

      const parents = this.getBiologicalParents(currentId);
      for (const parent of parents) {
        if (!visited.has(parent.id)) {
          visited.add(parent.id);
          const gen = generation + 1;
          ancestors.push({ member: parent, generation: gen });
          queue.push({ id: parent.id, generation: gen });
        }
      }
    }

    return ancestors;
  }

  /** Get all descendants up to N generations (BFS) */
  getDescendants(id, maxGenerations = Infinity) {
    const descendants = [];
    const visited = new Set([id]);
    let queue = [{ id, generation: 0 }];

    while (queue.length > 0) {
      const { id: currentId, generation } = queue.shift();
      if (generation >= maxGenerations) continue;

      const children = this.getChildren(currentId, { type: EdgeType.BIOLOGICAL_PARENT });
      for (const child of children) {
        if (!visited.has(child.id)) {
          visited.add(child.id);
          const gen = generation + 1;
          descendants.push({ member: child, generation: gen });
          queue.push({ id: child.id, generation: gen });
        }
      }
    }

    return descendants;
  }

  /** Trace patrilineal lineage (father's father's father...) */
  getPatrilineage(id) {
    const lineage = [];
    let currentId = id;

    while (currentId) {
      const member = this.nodes.get(currentId);
      if (!member) break;
      if (currentId !== id) lineage.push(member);

      const parents = this.getBiologicalParents(currentId);
      const father = parents.find(p => p.gender === 'Male');
      currentId = father?.id || null;
    }

    return lineage;
  }

  /** Trace matrilineal lineage (mother's mother's mother...) */
  getMatrilineage(id) {
    const lineage = [];
    let currentId = id;

    while (currentId) {
      const member = this.nodes.get(currentId);
      if (!member) break;
      if (currentId !== id) lineage.push(member);

      const parents = this.getBiologicalParents(currentId);
      const mother = parents.find(p => p.gender === 'Female');
      currentId = mother?.id || null;
    }

    return lineage;
  }

  /** Calculate generation depth (0 = root ancestor, increases downward) */
  getGeneration(id) {
    let depth = 0;
    let currentId = id;

    while (currentId) {
      const parents = this.getBiologicalParents(currentId);
      if (parents.length === 0) break;
      currentId = parents[0].id;
      depth++;
    }

    return depth;
  }

  // ─── Common Ancestor ─────────────────────────────────────────────────────

  /** Find the lowest common ancestor(s) of two members */
  findCommonAncestors(id1, id2) {
    const ancestors1 = new Set([id1, ...this.getAncestors(id1).map(a => a.member.id)]);
    const ancestors2 = this.getAncestors(id2);

    const common = ancestors2
      .filter(a => ancestors1.has(a.member.id))
      .map(a => a.member);

    // Filter to lowest common ancestors (those without descendants that are also common)
    const commonIds = new Set(common.map(c => c.id));
    return common.filter(c => {
      const desc = this.getDescendants(c.id, 5);
      return !desc.some(d => commonIds.has(d.member.id) && d.member.id !== c.id);
    });
  }

  // ─── Connected Components ────────────────────────────────────────────────

  /** Find all connected components (clusters of related members) */
  getConnectedComponents() {
    const visited = new Set();
    const components = [];

    for (const id of this.nodes.keys()) {
      if (visited.has(id)) continue;

      const component = [];
      const queue = [id];
      visited.add(id);

      while (queue.length > 0) {
        const currentId = queue.shift();
        const member = this.nodes.get(currentId);
        if (member) component.push(member);

        const edges = this.adjacency.get(currentId) || [];
        for (const edge of edges) {
          if (!visited.has(edge.toId) && edge.active) {
            visited.add(edge.toId);
            queue.push(edge.toId);
          }
        }
      }

      components.push(component);
    }

    // Sort: largest component first
    return components.sort((a, b) => b.length - a.length);
  }

  /** Get orphan nodes (members not connected to the main family tree) */
  getOrphans() {
    const components = this.getConnectedComponents();
    if (components.length <= 1) return [];

    // Everything except the largest component is "orphaned"
    return components.slice(1).flat();
  }

  /** Check if two members are in the same connected component */
  areConnected(id1, id2) {
    const visited = new Set();
    const queue = [id1];
    visited.add(id1);

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (currentId === id2) return true;

      const edges = this.adjacency.get(currentId) || [];
      for (const edge of edges) {
        if (!visited.has(edge.toId) && edge.active) {
          visited.add(edge.toId);
          queue.push(edge.toId);
        }
      }
    }

    return false;
  }

  // ─── Pathfinding & Relationship Resolution ───────────────────────────────

  /** BFS shortest path between two members */
  findPath(fromId, toId) {
    if (fromId === toId) return [];
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) return null;

    const queue = [{ id: fromId, path: [] }];
    const visited = new Set([fromId]);

    while (queue.length > 0) {
      const { id, path } = queue.shift();
      const edges = this.adjacency.get(id) || [];

      for (const edge of edges) {
        if (!edge.active) continue;
        if (visited.has(edge.toId)) continue;

        const step = {
          from: id,
          to: edge.toId,
          edgeType: edge.type,
          direction: this._stepDirection(edge.type),
        };
        const newPath = [...path, step];

        if (edge.toId === toId) return newPath;
        visited.add(edge.toId);
        queue.push({ id: edge.toId, path: newPath });
      }
    }

    return null; // No path
  }

  /** Map edge type to a semantic traversal direction */
  _stepDirection(edgeType) {
    if (edgeType.startsWith('child_of_')) return 'up';   // going to parent
    if (PARENT_EDGE_TYPES.includes(edgeType)) return 'down'; // going to child
    if (edgeType === EdgeType.SPOUSE || edgeType === EdgeType.FORMER_SPOUSE) return 'lateral';
    return 'unknown';
  }

  /** Determine relationship between two people */
  findRelationship(fromId, toId) {
    if (fromId === toId) {
      return {
        key: 'self',
        terms: RELATIONSHIP_TERMS.self,
        path: [],
        description: 'Same person',
        generation: 0,
      };
    }

    const path = this.findPath(fromId, toId);

    if (!path) {
      // Check if they're in the same component at all
      const connected = this.areConnected(fromId, toId);
      return {
        key: 'unknown',
        terms: null,
        path: null,
        description: connected
          ? 'Related but path could not be determined'
          : 'Not connected — these members are in separate family clusters',
        connected,
      };
    }

    const key = this._interpretPath(path, fromId, toId);
    const terms = RELATIONSHIP_TERMS[key] || RELATIONSHIP_TERMS.relative;

    // Calculate generation difference
    const genDiff = path.reduce((diff, step) => {
      if (step.direction === 'up') return diff - 1;
      if (step.direction === 'down') return diff + 1;
      return diff;
    }, 0);

    // Build path description
    const pathDescription = path.map(step => {
      const person = this.nodes.get(step.to);
      return `${step.direction}→${person?.firstName || '?'}`;
    }).join(' · ');

    return {
      key,
      terms,
      path,
      pathDescription,
      description: terms.en,
      generation: genDiff,
      steps: path.length,
    };
  }

  /** Interpret a BFS path into a relationship key */
  _interpretPath(path, fromId, toId) {
    const source = this.nodes.get(fromId);
    const target = this.nodes.get(toId);
    if (!source || !target) return 'relative';

    const directions = path.map(s => s.direction);
    const edgeTypes = path.map(s => s.edgeType);
    const len = path.length;

    const targetGender = target.gender;
    const sourceGender = source.gender;

    // Helper: is an edge a parent traversal (going up)?
    const isUp = (d) => d === 'up';
    const isDown = (d) => d === 'down';
    const isLateral = (d) => d === 'lateral';

    // Helper: check if a parent edge is through father or mother
    const parentGender = (stepIndex) => {
      const parentId = path[stepIndex].to;
      const parent = this.nodes.get(parentId);
      return parent?.gender;
    };

    // ── 1 step ──
    if (len === 1) {
      if (isUp(directions[0])) {
        // Going to parent
        if (edgeTypes[0].includes('adoptive')) return targetGender === 'Male' ? 'adoptive_father' : 'adoptive_mother';
        if (edgeTypes[0].includes('step'))     return targetGender === 'Male' ? 'step_father' : 'step_mother';
        return targetGender === 'Male' ? 'father' : 'mother';
      }
      if (isDown(directions[0])) {
        return targetGender === 'Male' ? 'son' : 'daughter';
      }
      if (isLateral(directions[0])) {
        return targetGender === 'Male' ? 'husband' : 'wife';
      }
    }

    // ── 2 steps ──
    if (len === 2) {
      // Grandparents: up, up
      if (isUp(directions[0]) && isUp(directions[1])) {
        const firstParentGender = parentGender(0);
        if (firstParentGender === 'Male') {
          return targetGender === 'Male' ? 'paternal_grandfather' : 'paternal_grandmother';
        }
        return targetGender === 'Male' ? 'maternal_grandfather' : 'maternal_grandmother';
      }

      // Grandchildren: down, down
      if (isDown(directions[0]) && isDown(directions[1])) {
        return targetGender === 'Male' ? 'grandson' : 'granddaughter';
      }

      // Siblings: up then down (same parent)
      if (isUp(directions[0]) && isDown(directions[1])) {
        const isElder = this._isElder(target, source);
        if (targetGender === 'Male') {
          return isElder ? 'elder_brother' : 'younger_brother';
        }
        return isElder ? 'elder_sister' : 'younger_sister';
      }

      // In-laws via spouse: lateral + up
      if (isLateral(directions[0]) && isUp(directions[1])) {
        return targetGender === 'Male' ? 'father_in_law' : 'mother_in_law';
      }

      // Child's spouse: down + lateral
      if (isDown(directions[0]) && isLateral(directions[1])) {
        return targetGender === 'Male' ? 'son_in_law' : 'daughter_in_law';
      }

      // Spouse's child (step-child): lateral + down
      if (isLateral(directions[0]) && isDown(directions[1])) {
        return targetGender === 'Male' ? 'son' : 'daughter';
      }
    }

    // ── 3 steps ──
    if (len === 3) {
      // Great-grandparents: up, up, up
      if (directions.every(isUp)) {
        return targetGender === 'Male' ? 'great_grandfather' : 'great_grandmother';
      }

      // Great-grandchildren: down, down, down
      if (directions.every(isDown)) {
        return targetGender === 'Male' ? 'great_grandson' : 'great_granddaughter';
      }

      // Uncle/Aunt: up, up, down (parent's sibling)
      if (isUp(directions[0]) && isUp(directions[1]) && isDown(directions[2])) {
        const firstParentGender = parentGender(0);

        if (firstParentGender === 'Male') {
          // Father's side
          if (targetGender === 'Male') {
            const isElder = this._isElder(target, this.nodes.get(path[0].to));
            return isElder ? 'paternal_uncle_elder' : 'paternal_uncle_younger';
          }
          return 'paternal_aunt';
        } else {
          // Mother's side
          if (targetGender === 'Male') return 'maternal_uncle';
          const isElder = this._isElder(target, this.nodes.get(path[0].to));
          return isElder ? 'maternal_aunt_elder' : 'maternal_aunt_younger';
        }
      }

      // Nephew/Niece: up, down, down (sibling's child) — parent → sibling → their child
      if (isUp(directions[0]) && isDown(directions[1]) && isDown(directions[2])) {
        return targetGender === 'Male' ? 'nephew' : 'niece';
      }

      // Brother/Sister-in-law: lateral, up, down (spouse's sibling)
      if (isLateral(directions[0]) && isUp(directions[1]) && isDown(directions[2])) {
        return targetGender === 'Male' ? 'brother_in_law' : 'sister_in_law';
      }

      // Brother/Sister-in-law: up, down, lateral (sibling's spouse)
      if (isUp(directions[0]) && isDown(directions[1]) && isLateral(directions[2])) {
        return targetGender === 'Male' ? 'brother_in_law' : 'sister_in_law';
      }
    }

    // ── 4 steps ──
    if (len === 4) {
      // Cousins: up, up, down, down
      const upCount = directions.filter(isUp).length;
      const downCount = directions.filter(isDown).length;

      if (upCount === 2 && downCount === 2 &&
          isUp(directions[0]) && isUp(directions[1]) &&
          isDown(directions[2]) && isDown(directions[3])) {
        return targetGender === 'Male' ? 'cousin_brother' : 'cousin_sister';
      }

      // Uncle/Aunt's spouse: up, up, down, lateral
      if (isUp(directions[0]) && isUp(directions[1]) && isDown(directions[2]) && isLateral(directions[3])) {
        const firstParentGender = parentGender(0);
        if (firstParentGender === 'Male') {
          // Father's side
          const siblingGender = this.nodes.get(path[2].to)?.gender;
          if (siblingGender === 'Male') return 'paternal_uncle_wife';
          return 'paternal_aunt_husband';
        } else {
          const siblingGender = this.nodes.get(path[2].to)?.gender;
          if (siblingGender === 'Male') return 'maternal_uncle_wife';
          return 'maternal_aunt_husband';
        }
      }
    }

    // ── Generic: count ups and downs for generation-based labeling ──
    const ups = directions.filter(isUp).length;
    const downs = directions.filter(isDown).length;
    const laterals = directions.filter(isLateral).length;

    // All ups — ancestor
    if (downs === 0 && laterals === 0 && ups > 3) {
      const prefix = 'Great-'.repeat(ups - 2);
      return targetGender === 'Male' ? 'great_grandfather' : 'great_grandmother';
    }

    // All downs — descendant
    if (ups === 0 && laterals === 0 && downs > 3) {
      return targetGender === 'Male' ? 'great_grandson' : 'great_granddaughter';
    }

    return 'relative';
  }

  /** Compare DOBs to determine elder/younger */
  _isElder(person1, person2) {
    if (!person1?.dob || !person2?.dob) return true; // default to elder if unknown
    return new Date(person1.dob) < new Date(person2.dob);
  }

  // ─── Analytics ───────────────────────────────────────────────────────────

  /** Get tree statistics */
  getStats() {
    const components = this.getConnectedComponents();
    const allGenerations = [];

    for (const [id] of this.nodes) {
      allGenerations.push(this.getGeneration(id));
    }

    const maxGeneration = allGenerations.length > 0 ? Math.max(...allGenerations) : 0;

    // Find root ancestors (members with no parents)
    const roots = [];
    for (const [id, member] of this.nodes) {
      if (this.getBiologicalParents(id).length === 0) {
        roots.push(member);
      }
    }

    return {
      totalMembers: this.nodes.size,
      totalEdges: this.edges.length / 2, // each relationship has 2 directed edges
      connectedComponents: components.length,
      orphanCount: components.length > 1 ? components.slice(1).reduce((s, c) => s + c.length, 0) : 0,
      maxGenerationDepth: maxGeneration,
      rootAncestors: roots,
      largestComponentSize: components[0]?.length || 0,
    };
  }

  /** Detect potential data issues */
  getDataIssues() {
    const issues = [];

    for (const [id, member] of this.nodes) {
      // Orphan (no connections at all)
      const edges = this.adjacency.get(id) || [];
      if (edges.length === 0) {
        issues.push({
          type: 'isolated',
          memberId: id,
          member,
          message: `${member.firstName} ${member.lastName || ''} has no family connections`,
        });
      }

      // Missing gender
      if (!member.gender) {
        issues.push({
          type: 'missing_gender',
          memberId: id,
          member,
          message: `${member.firstName} has no gender set — affects relationship terms`,
        });
      }

      // Circular parent reference
      if (member.fatherId === id || member.motherId === id) {
        issues.push({
          type: 'self_reference',
          memberId: id,
          member,
          message: `${member.firstName} references themselves as a parent`,
        });
      }
    }

    // Disconnected components
    const components = this.getConnectedComponents();
    if (components.length > 1) {
      components.slice(1).forEach((component, i) => {
        issues.push({
          type: 'disconnected_cluster',
          members: component,
          message: `${component.length} member(s) disconnected from main tree: ${component.map(m => m.firstName).join(', ')}`,
        });
      });
    }

    return issues;
  }
}

// ─── Export convenience function (drop-in for old findRelationship) ─────────

export function findRelationship(members, fromId, toId) {
  const graph = new FamilyGraph(members);
  return graph.findRelationship(fromId, toId);
}

export { RELATIONSHIP_TERMS };

export default FamilyGraph;
