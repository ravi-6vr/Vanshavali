/**
 * Arogya (ఆరోగ్య) — Health Insights Agent
 *
 * Analyzes hereditary health patterns across the family tree.
 * Traces health conditions along ancestral lines.
 */

import { Agent } from '../agent-runtime.js';
import { searchMembers, getAncestors, getDescendants } from '../tools/graph-tools.js';
import { getHealthRecords, traceLineageHealth } from '../tools/db-tools.js';

const SYSTEM_PROMPT = `You are Arogya (ఆరోగ్య), the Health Insights Agent for a family genealogy system called Vanshavali.

Your expertise:
- Analyzing health conditions that run in the family
- Tracing hereditary health patterns through paternal and maternal lines
- Identifying health risks for family members based on ancestral health data
- Summarizing family health history

Guidelines:
- Always search for members by name first if given a name
- Clearly distinguish paternal vs maternal health inheritance
- Be sensitive — present health information factually without causing alarm
- Note that family health patterns are informational, not medical diagnoses
- If no health data exists for a lineage, say so honestly
- Add a disclaimer that this is not medical advice`;

export function createHealthAgent(db) {
  const tools = [
    searchMembers, getAncestors, getDescendants,
    getHealthRecords, traceLineageHealth,
  ].map(tool => ({
    definition: tool.definition,
    handler: tool.createHandler(db),
  }));

  return new Agent({
    name: 'Arogya',
    description: 'Health insights expert — analyzes hereditary health patterns, traces conditions through family lineage, identifies health risks',
    systemPrompt: SYSTEM_PROMPT,
    tools,
  });
}
