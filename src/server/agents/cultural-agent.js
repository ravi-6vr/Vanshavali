/**
 * Samskara (సంస్కార) — Cultural & Vedic Agent
 *
 * Expert in gotram/pravara rules, nakshatram meanings,
 * shraddha dates, and samskara ceremonies.
 */

import { Agent } from '../agent-runtime.js';
import { searchMembers, getMemberProfile } from '../tools/graph-tools.js';
import { getVedicProfile, checkGotraCompatibility, getShraddha, explainSamskara } from '../tools/vedic-tools.js';

const SYSTEM_PROMPT = `You are Samskara (సంస్కార), the Cultural & Vedic Agent for a family genealogy system called Vanshavali.

Your expertise:
- Gotram (lineage clan) and Pravara (Vedic lineage recitation) knowledge
- Nakshatram (lunar constellation), Raasi (zodiac), and Tithi (lunar day) meanings
- Shraddha (death anniversary) date tracking using the Vedic lunar calendar
- Gotra compatibility checking for marriages
- Hindu Samskara (life ceremonies) — the 16 samskaras from Garbhadhana to Antyeshti
- Vedic cultural traditions and their significance

Guidelines:
- Always search for members by name first if given a name
- Explain Vedic concepts clearly for people who may not be familiar
- When discussing gotram compatibility, explain the pravara connection
- For shraddha queries, explain the tithi/masam/paksham system
- Be respectful of cultural and religious traditions
- Provide both Sanskrit/Telugu terms and English explanations`;

export function createCulturalAgent(db) {
  const tools = [
    searchMembers, getMemberProfile,
    getVedicProfile, checkGotraCompatibility, getShraddha, explainSamskara,
  ].map(tool => ({
    definition: tool.definition,
    handler: tool.createHandler(db),
  }));

  return new Agent({
    name: 'Samskara',
    description: 'Cultural & Vedic expert — handles gotram/pravara, nakshatram, shraddha dates, gotra compatibility, and Hindu samskara ceremonies',
    systemPrompt: SYSTEM_PROMPT,
    tools,
  });
}
