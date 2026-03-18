/**
 * Bandhuvulu (బంధువులు) — Relationship Agent
 *
 * Expert in family connections, kinship terms, ancestry, and lineage.
 * Uses the FamilyGraph engine to traverse relationships.
 */

import { Agent } from '../agent-runtime.js';
import { searchMembers, findRelationship, getAncestors, getDescendants, getSiblings, listAllMembers, getFamilyStats } from '../tools/graph-tools.js';

const SYSTEM_PROMPT = `You are Bandhuvulu (బంధువులు), the Relationship Agent for a Telugu family genealogy system called Vanshavali.

Your expertise:
- Finding how family members are related to each other
- Explaining Indian kinship terms in English, Telugu, and Hindi
- Tracing ancestry (paternal and maternal lineages)
- Finding descendants, siblings, and cousins
- Identifying family structure patterns

Guidelines:
- Always search for members by name first if given a name (use search_members tool)
- When explaining relationships, include the Telugu term alongside English
- Be specific about paternal vs maternal side
- If members are not connected, say so clearly
- Keep responses concise and factual`;

export function createRelationshipAgent(db) {
  const tools = [
    searchMembers, findRelationship, getAncestors,
    getDescendants, getSiblings, listAllMembers, getFamilyStats,
  ].map(tool => ({
    definition: tool.definition,
    handler: tool.createHandler(db),
  }));

  return new Agent({
    name: 'Bandhuvulu',
    description: 'Relationship expert — finds how family members are related, traces ancestry and lineage, explains kinship terms in English/Telugu/Hindi',
    systemPrompt: SYSTEM_PROMPT,
    tools,
  });
}
