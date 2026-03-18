# Vanshavali — Project Tracker

> Family tree (వంశావళి) app built with React 19 + Vite + Express 5 + SQLite
> Last updated: 2026-03-17

---

## Architecture

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | React 19 + Vite | SPA with react-router-dom v7 |
| Styling | Tailwind CSS | Custom saffron/sacred color palette, Telugu font support (Tiro Telugu) |
| Backend | Express 5 | REST API on port 3001, handles CRUD + relationship sync |
| Database | SQLite (better-sqlite3) | WAL mode, single file at `data-json/vanshavali.db` |
| Desktop | Electron 36 | Optional native wrapper |
| State | React Context | `FamilyContext.jsx` — single source of truth for all members |
| Visualization | D3.js 7 | 5 tree modes: Banyan, Radial, Pedigree, Fan, Timeline |
| Maps | Leaflet + OpenStreetMap | Migration history |
| i18n | i18next | English, Telugu, Hindi |
| Validation | Zod 4 | Server-side member schema validation |

---

## Completed Features

### Core
- [x] Member CRUD (add, edit, delete) with rich fields (DOB, gender, gotram, nakshatra, etc.)
- [x] Server-side bidirectional relationship sync (Express API)
  - Parent↔childrenIds, spouse↔spouse, handles removals
  - Merge-based save: `{ ...existing, ...new }` preserves fields
- [x] Searchable MemberPicker component (search-by-name, gender-filtered)
- [x] SQLite database with WAL mode (migrated from JSON file storage)
- [x] Zod schema validation on member save
- [x] GEDCOM 5.5.1 import/export (with custom `_GOTRAM`, `_NAKSHATRAM`, `_RAASI` tags)
- [x] JSON export/import for backups
- [x] Duplicate detection (Levenshtein distance + DOB/gotram matching)
- [x] Global omnisearch (Cmd+K) across members and stories
- [x] Photo gallery per member (base64 storage)
- [x] Family stories with member tagging
- [x] Demo seed script (`npm run seed`) — 19 fictional members, 3 stories

### FamilyGraph Engine (`src/utils/FamilyGraph.js`)
- [x] Typed edges: BIOLOGICAL_PARENT, ADOPTIVE_PARENT, STEP_PARENT, GUARDIAN, SPOUSE, FORMER_SPOUSE
- [x] Edge metadata: startDate, endDate, isActive, notes
- [x] BFS pathfinding with direction-aware steps (up/down/lateral)
- [x] 50+ Indian relationship terms with Telugu & Hindi scripts
- [x] Connected component analysis, ancestor/descendant traversal
- [x] Common ancestor finder, data issue detection

### Pages (15 total)
- [x] Dashboard — stats, On This Day, birthdays, anniversaries, shraddhas, family narrative
- [x] Member List — searchable, filterable
- [x] Member Form — add/edit with searchable pickers
- [x] Member Profile — mini tree, journey timeline, samskaras, photos
- [x] Family Tree — 5 D3.js visualization modes
- [x] Relationship Finder — kinship terms in EN/TE/HI
- [x] Shraddha Calendar — Vedic death anniversary tracking
- [x] Gotra Checker — compatibility checking
- [x] Health Tracker — family health conditions
- [x] Analytics — charts and statistics
- [x] Stories — family narratives
- [x] Migration Map — Leaflet/OpenStreetMap
- [x] Duplicate Checker — detect and merge
- [x] All Events — calendar view
- [x] Settings — language, PIN lock, export/import

### Components
- [x] Layout with sidebar navigation
- [x] PIN Lock Screen
- [x] Global Search (Cmd+K)
- [x] Mini Family Tree (SVG)
- [x] Journey Timeline, Samskara Timeline
- [x] Kundali Grid, Pravara Generator
- [x] Memory Wall, Photo Gallery
- [x] Completeness Bar, Onboarding Wizard

---

## Bugs Fixed

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Children names not showing | Separate state objects caused race condition | Single `childrenList` state with baked-in names |
| saveMember overwrites health/memories | Direct object replacement | Merge-based save `{ ...existing, ...new }` |
| syncRelationships only adds | No cleanup of old references | Full rewrite with old parent/spouse clearing |
| Relationship Finder "Not connected" | BFS logic bug in edge filtering | Split active check from visited check |

---

## Future Roadmap

- [ ] Web deployment (Vercel/Render) for portfolio demo
- [ ] CSV/Excel import/export
- [ ] Print/PDF export of family tree
- [ ] PWA support for mobile
- [ ] Cloud sync (optional, encrypted)
- [ ] Birthday/anniversary notification reminders

---

## Dev Notes

### How to Run
```bash
npm install
npm run seed        # Populate demo data
npm run dev         # Web mode (Vite + Express)
npm run electron:dev # Desktop mode (+ Electron)
npm run desktop     # Production desktop build
```

### Key Design Decisions
- **Merge-based save** — never replace a member object, always merge
- **FamilyGraph is stateless** — rebuilt from members array via `useMemo`
- **Server-side sync** — relationship integrity enforced at the API layer
- **GEDCOM interop** — custom tags for Vedic fields not in the standard
- **Demo seed data** — fictional family for testing; real data gitignored
