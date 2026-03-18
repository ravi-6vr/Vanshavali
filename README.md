# Vanshavali (వంశావళి)

A privacy-first family genealogy platform with deep Indian/Vedic cultural context. Track lineage, gotrams, nakshatrams, shraddha dates, migration history, health records, and family stories — all offline, all private.

![Tech Stack](https://img.shields.io/badge/React-19-blue) ![Tech Stack](https://img.shields.io/badge/Express-5-green) ![Tech Stack](https://img.shields.io/badge/SQLite-3-orange) ![Tech Stack](https://img.shields.io/badge/D3.js-7-red) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Features

### Core Genealogy
- **Member management** — Add/edit/delete family members with rich biographical data
- **Bidirectional relationship sync** — Setting a father automatically updates the father's children list (and vice versa for mother, spouse)
- **5 family tree visualizations** — Banyan (top-down), Radial, Pedigree, Fan Chart, Timeline (powered by D3.js)
- **Relationship finder** — Select two members → computes the relationship with 50+ kinship terms in English, Telugu (తెలుగు), and Hindi (हिन्दी)
- **Duplicate detection** — Levenshtein distance + DOB/gotram matching to find and merge duplicate entries
- **GEDCOM 5.5.1 import/export** — Compatible with Ancestry, FamilySearch, MyHeritage (includes custom `_GOTRAM`, `_NAKSHATRAM`, `_RAASI` tags)

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
- **No telemetry** — Zero network calls except OpenStreetMap tiles for maps
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
git clone https://github.com/<your-username>/vanshavali.git
cd vanshavali
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
│   ├── components/             # Layout, LockScreen, GlobalSearch, etc.
│   ├── context/
│   │   └── FamilyContext.jsx   # Global state — all member CRUD
│   ├── utils/
│   │   ├── FamilyGraph.js      # Graph engine — BFS, 50+ relationship terms
│   │   ├── shraddha.js         # Vedic lunar calendar calculations
│   │   └── completeness.js     # Data completeness scoring
│   ├── data/
│   │   └── vedic.js            # Nakshatras, tithis, gotrams, samskaras
│   └── i18n/                   # Translations (en, te, hi)
├── server.js                   # Express API + SQLite + GEDCOM engine
├── scripts/
│   └── seed-demo.js            # Demo data seeder
├── electron/                   # Electron main process (optional)
└── data-json/                  # SQLite DB + photos (gitignored)
```

---

## Architecture

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

---

## Languages

English, Telugu (తెలుగు), Hindi (हिन्दी) — switchable from Settings.

Relationship terms are localized with culturally accurate kinship vocabulary:
- **Telugu**: అన్నయ్య (elder brother), తమ్ముడు (younger brother), వదిన (elder brother's wife)
- **Hindi**: भैया (elder brother), भाभी (elder brother's wife), मामा (maternal uncle)

---

## Privacy

All data stays in `data-json/vanshavali.db` on your machine. The `.gitignore` excludes the database, photos, and auth files from version control. The demo seed script provides fictional data for testing and demonstration.

---

## License

MIT
