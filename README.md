# Vanshavali (వంశావళి)

A privacy-first family genealogy platform with deep Indian/Vedic cultural context and a **multi-agent LLM system** for intelligent family data queries. Track lineage, gotrams, nakshatrams, shraddha dates, migration history, health records, and family stories — all offline, all private.

![Tech Stack](https://img.shields.io/badge/React-19-blue) ![Tech Stack](https://img.shields.io/badge/Express-5-green) ![Tech Stack](https://img.shields.io/badge/SQLite-3-orange) ![Tech Stack](https://img.shields.io/badge/D3.js-7-red) ![Tech Stack](https://img.shields.io/badge/Multi--Agent_LLM-AI-purple) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Features

### Core Genealogy
- **Member management** — Add/edit/delete family members with rich biographical data
- **Bidirectional relationship sync** — Setting a father automatically updates the father's children list (and vice versa for mother, spouse)
- **5 family tree visualizations** — Banyan (top-down), Radial, Pedigree, Fan Chart, Timeline (powered by D3.js)
- **Relationship finder** — Select two members → computes the relationship with 50+ kinship terms in English, Telugu (తెలుగు), and Hindi (हिन्दी)
- **Duplicate detection** — Levenshtein distance + DOB/gotram matching to find and merge duplicate entries
- **GEDCOM 5.5.1 import/export** — Compatible with Ancestry, FamilySearch, MyHeritage (includes custom `_GOTRAM`, `_NAKSHATRAM`, `_RAASI` tags)

### Multi-Agent LLM System
An orchestrator + 4 specialized AI agents that collaboratively answer questions about your family data:

| Agent | Name | What it does |
|-------|------|-------------|
| **Orchestrator** | Kula (కుల) | Routes queries to the right agent(s), decomposes multi-domain questions, synthesizes final answers |
| **Relationship** | Bandhuvulu (బంధువులు) | Traces ancestry, finds kinship paths via BFS, explains relationship terms in EN/TE/HI |
| **Health** | Arogya (ఆరోగ్య) | Analyzes hereditary health patterns across paternal and maternal lineages |
| **Story** | Katha (కథ) | Generates biographical narratives, weaves together journey events and family stories |
| **Cultural** | Samskara (సంస్కార) | Handles gotram/pravara queries, shraddha dates, gotra compatibility, samskara ceremonies |

**Key design:**
- Agents use **tool calling** (function calling) to query FamilyGraph, SQLite, and Vedic data — not just text generation
- Orchestrator **decomposes complex queries** across multiple agents (e.g., "What health risks does my daughter have from both sides?" → Relationship agent traces lineage → Health agent analyzes conditions)
- **Provider-agnostic** — supports Ollama Cloud, OpenAI, Anthropic, Groq, Together AI, local Ollama, or any OpenAI-compatible API
- **Optional** — app works fully without LLM; AI is an enhancement, not a dependency
- **API key stays in browser** localStorage — never stored on server or committed to git

### Vedic & Cultural
- **Gotram tracking** with pravara (Vedic lineage recitation) generation
- **Nakshatram, Raasi, Tithi** fields per member with auto-derivation (nakshatram + pada → raasi)
- **Shraddha calendar** — Death anniversaries calculated by Vedic lunar calendar (tithi/paksham/masam)
- **Samskara timeline** — Track 16 Hindu life ceremonies (Namakarana to Antyeshti)
- **Kundali grid** — Vedic birth chart display
- **Gotra compatibility checker** — Verify gotram compatibility between families

### Analytics & Visualization
- **Dashboard** — Stats, upcoming birthdays/anniversaries/shraddhas, gotram distribution, "On This Day"
- **Migration map** — Plot family migration history on Leaflet/OpenStreetMap
- **Health tracker** — Track hereditary conditions across the family tree
- **Family analytics** — Age distribution, gender ratio, generation depth charts
- **Family stories** — Narratives tagged to members with full-text search

### Privacy & Security
- **Local-first** — All data stays in a single SQLite file on your machine
- **No telemetry** — Zero network calls except OpenStreetMap tiles and optional LLM API
- **PIN lock** — Password protection for shared computers
- **No accounts** — No sign-up, no cloud, no vendor lock-in

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite | SPA with hot module reloading |
| Styling | Tailwind CSS | Custom saffron/temple/sacred color palette, Telugu font support |
| Backend | Express 5 | REST API (local, port 3001) |
| Database | SQLite (better-sqlite3) | Single-file storage with WAL mode |
| Visualization | D3.js 7 | 5 family tree rendering modes |
| Maps | Leaflet + OpenStreetMap | Migration history visualization |
| AI | Multi-Agent LLM (Ollama/OpenAI/Anthropic) | Orchestrator + 4 domain-specific agents with tool calling |
| Localization | i18next | English, Telugu, Hindi |
| Validation | Zod 4 | Runtime schema validation |
| Desktop | Electron 36 | Optional native desktop wrapper |

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Install & Run (Web)

```bash
git clone https://github.com/ravi-6vr/Vanshavali.git
cd Vanshavali
npm install
npm run seed        # Populate with demo family data
npm run dev         # Starts Express API + Vite dev server
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run as Desktop App (Electron)

```bash
npm run electron:dev
```

### Production Build

```bash
npm run build       # Build React app
npm run desktop     # Build + launch Electron
```

### AI Setup (Optional)

1. Go to **Settings → AI Configuration**
2. Select a provider (Ollama Cloud, OpenAI, Groq, etc.)
3. Paste your API key
4. Click **Test Connection** to verify
5. Click **Save** — the chat button appears at bottom-right (or press `Ctrl+Shift+K`)

---

## Demo Data

The project includes a seed script that populates the database with a fictional 4-generation Telugu Brahmin family (the Shastri family) — 19 members with gotrams, nakshatrams, migration history, samskaras, stories, and relationships.

```bash
npm run seed              # Seed only if DB is empty
npm run seed -- --force   # Wipe and re-seed
```

---

## Project Structure

```
vanshavali/
├── src/
│   ├── pages/                  # 15 page components
│   │   ├── Dashboard.jsx       # Stats, events, family narrative
│   │   ├── MemberForm.jsx      # Add/edit with searchable pickers
│   │   ├── MemberProfile.jsx   # Profile with mini tree & timeline
│   │   ├── FamilyTree.jsx      # 5 D3.js visualizations
│   │   ├── RelationshipFinder  # Compute kinship terms (EN/TE/HI)
│   │   ├── ShraddhaCalendar    # Vedic death anniversary calendar
│   │   ├── MigrationMap.jsx    # Leaflet map of family movements
│   │   └── ...                 # Analytics, Health, Stories, Settings
│   ├── components/             # Layout, LockScreen, GlobalSearch, AIChatPanel
│   ├── context/
│   │   └── FamilyContext.jsx   # Global state — all member CRUD
│   ├── utils/
│   │   ├── FamilyGraph.js      # Graph engine — BFS, 50+ relationship terms
│   │   ├── shraddha.js         # Vedic lunar calendar calculations
│   │   └── completeness.js     # Data completeness scoring
│   ├── data/
│   │   └── vedic.js            # Nakshatras, tithis, gotrams, samskaras
│   ├── i18n/                   # Translations (en, te, hi)
│   └── server/                 # Multi-Agent LLM System
│       ├── agent-runtime.js    # Base Agent class (LLM + tool-call loop)
│       ├── message-bus.js      # Agent-to-agent communication
│       ├── orchestrator.js     # Kula — routes, decomposes, synthesizes
│       ├── agents/
│       │   ├── relationship-agent.js  # Bandhuvulu — kinship queries
│       │   ├── health-agent.js        # Arogya — hereditary analysis
│       │   ├── story-agent.js         # Katha — narrative generation
│       │   └── cultural-agent.js      # Samskara — Vedic queries
│       └── tools/
│           ├── graph-tools.js  # FamilyGraph wrapped as LLM tools
│           ├── db-tools.js     # SQLite query tools
│           └── vedic-tools.js  # Vedic data lookup tools
├── server.js                   # Express API + SQLite + GEDCOM + AI chat
├── scripts/
│   └── seed-demo.js            # Demo data seeder
├── electron/                   # Electron main process (optional)
└── data-json/                  # SQLite DB + photos (gitignored)
```

---

## Architecture

### Multi-Agent LLM System

```
                      User Query (chat panel)
                            │
                   ┌────────▼────────┐
                   │    Kula          │  Orchestrator
                   │  (Router +      │  Decomposes, routes,
                   │   Synthesizer)  │  synthesizes
                   └───┬───┬───┬───┬─┘
                       │   │   │   │
          ┌────────────┘   │   │   └────────────┐
          ▼                ▼   ▼                ▼
   ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐
   │ Bandhuvulu  │  │  Arogya  │  │  Katha   │  │ Samskara  │
   │ Relationship│  │  Health  │  │  Story   │  │ Cultural  │
   │   Agent     │  │  Agent   │  │  Agent   │  │  Agent    │
   └──────┬──────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘
          │               │             │               │
     FamilyGraph      DB queries    DB queries      vedic.js
     (BFS, paths)    (health data)  (stories)     (gotram, etc.)
```

- **Tool calling**: Each agent has access to specific tools (15 total) that query the database and graph engine
- **Parallel dispatch**: Independent agent queries run concurrently
- **Sequential chaining**: Dependent queries run in order (e.g., trace lineage first, then analyze health)
- **Shared context**: Agents build on each other's findings via the message bus

### Graph Engine (`FamilyGraph.js`)
The core relationship engine models family connections as a directed graph with typed edges:
- **Edge types**: Biological, Adoptive, Step-parent, Guardian, Spouse, Former Spouse
- **BFS pathfinding** to compute relationships between any two members
- **50+ Indian kinship terms** — నాన్న, అమ్మ, అత్త, బాబాయి, పెదనాన్న, పిన్ని, మామయ్య, etc.
- Direction-aware traversal (up/down/lateral) with elder/younger and paternal/maternal distinction

### Bidirectional Sync
When a member is saved, the server automatically synchronizes all related records:
- Setting `fatherId` → adds child to father's `childrenIds`
- Setting `spouseId` → makes it bidirectional
- Changing parents → clears old parent references

### Database
Single SQLite file with 3 tables:
- **members** — `id` + `data` (JSON blob with full member schema)
- **stories** — Title, content, tagged member IDs, tags
- **photos** — Base64 images linked to members

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/members` | List all members |
| POST | `/api/members/new` | Create member (with relationship sync) |
| PUT | `/api/members/:id` | Update member (merge + sync) |
| DELETE | `/api/members/:id` | Delete member (cleans references) |
| GET | `/api/export?format=json\|gedcom` | Export data |
| POST | `/api/import` | Import from GEDCOM or JSON |
| GET | `/api/duplicates` | Find duplicate members |
| GET | `/api/search?q=...` | Global search |
| GET/POST/DELETE | `/api/stories` | Family stories CRUD |
| GET/POST/DELETE | `/api/photos` | Photo management |
| POST | `/api/chat` | AI chat (requires API key from client) |
| POST | `/api/ai/config` | Update AI configuration |

---

## Supported LLM Providers

| Provider | Base URL | Default Model |
|----------|----------|---------------|
| Ollama Cloud | `https://ollama.com` | qwen3-vl:235b-instruct |
| OpenAI | `https://api.openai.com/v1` | gpt-4o-mini |
| Anthropic | `https://api.anthropic.com/v1` | claude-sonnet-4-6 |
| Groq | `https://api.groq.com/openai/v1` | llama-3.3-70b |
| Together AI | `https://api.together.xyz/v1` | Llama-3-70b |
| Local Ollama | `http://localhost:11434/v1` | Any pulled model |
| Custom | User-defined | User-defined |

---

## Languages

English, Telugu (తెలుగు), Hindi (हिन्दी) — switchable from Settings.

Relationship terms are localized with culturally accurate kinship vocabulary:
- **Telugu**: అన్నయ్య (elder brother), తమ్ముడు (younger brother), వదిన (elder brother's wife)
- **Hindi**: भैया (elder brother), भाभी (elder brother's wife), मामा (maternal uncle)

---

## Privacy

All data stays in `data-json/vanshavali.db` on your machine. The `.gitignore` excludes the database, photos, and auth files from version control. LLM API keys are stored in browser localStorage only — never on the server or in git. The demo seed script provides fictional data for testing and demonstration.

---

## License

MIT
