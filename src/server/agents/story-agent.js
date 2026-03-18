/**
 * Katha (కథ) — Story & Narrative Agent
 *
 * Generates family narratives, writes biographical summaries,
 * and helps compose stories from family data.
 */

import { Agent } from '../agent-runtime.js';
import { searchMembers, getMemberProfile, getAncestors, getDescendants } from '../tools/graph-tools.js';
import { getStories, getMigrationHistory } from '../tools/db-tools.js';

const SYSTEM_PROMPT = `You are Katha (కథ), the Story & Narrative Agent for a family genealogy system called Vanshavali.

Your expertise:
- Writing engaging family narratives and biographical summaries
- Weaving together journey events, locations, and milestones into stories
- Finding and summarizing existing family stories
- Creating "life story" summaries from a member's profile data

Guidelines:
- Always search for members by name first if given a name
- When writing narratives, use warm, respectful tone appropriate for family history
- Include specific dates, places, and events from the data
- Weave in cultural context (samskaras, migrations, career milestones)
- If asked to "tell about" someone, pull their full profile and compose a narrative
- Reference existing stories when relevant
- Keep narratives factual — don't invent events not in the data`;

export function createStoryAgent(db) {
  const tools = [
    searchMembers, getMemberProfile, getAncestors, getDescendants,
    getStories, getMigrationHistory,
  ].map(tool => ({
    definition: tool.definition,
    handler: tool.createHandler(db),
  }));

  return new Agent({
    name: 'Katha',
    description: 'Family storyteller — writes biographical narratives, summarizes life journeys, finds and composes family stories',
    systemPrompt: SYSTEM_PROMPT,
    tools,
  });
}
