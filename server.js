import express from 'express';
import cors from 'cors';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import Database from 'better-sqlite3';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// === DATA DIRECTORY ===
const DATA_DIR = join(__dirname, 'data-json');
const PHOTOS_DIR = join(DATA_DIR, 'photos');
const DB_FILE = join(DATA_DIR, 'vanshavali.db');
const AUTH_FILE = join(DATA_DIR, '.vanshavali-auth.json');
const OLD_DATA_FILE = join(DATA_DIR, 'familyMembersData.json');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(PHOTOS_DIR)) mkdirSync(PHOTOS_DIR, { recursive: true });

// === SQLITE SETUP ===
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    member_ids TEXT DEFAULT '[]',
    tags TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    caption TEXT DEFAULT '',
    date_taken TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  );
`);

// === MIGRATE FROM JSON IF DB IS EMPTY ===
function migrateFromJson() {
  const count = db.prepare('SELECT COUNT(*) as c FROM members').get();
  if (count.c === 0 && existsSync(OLD_DATA_FILE)) {
    try {
      const raw = readFileSync(OLD_DATA_FILE, 'utf-8');
      const members = JSON.parse(raw);
      if (Array.isArray(members) && members.length > 0) {
        const insert = db.prepare('INSERT OR REPLACE INTO members (id, data) VALUES (?, ?)');
        const tx = db.transaction((items) => {
          for (const m of items) {
            insert.run(m.id, JSON.stringify(m));
          }
        });
        tx(members);
        console.log(`  Migrated ${members.length} members from JSON to SQLite`);
      }
    } catch (err) {
      console.error('  Migration from JSON failed:', err.message);
    }
  }
}
migrateFromJson();

// === ZOD VALIDATION ===
const MemberSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().default(''),
  gender: z.enum(['Male', 'Female', 'Other']).optional().default('Male'),
  dob: z.string().optional().default(''),
  tob: z.string().optional().default(''),
  pob: z.string().optional().default(''),
  nakshatram: z.string().optional().default(''),
  pada: z.string().optional().default(''),
  raasi: z.string().optional().default(''),
  tithi: z.string().optional().default(''),
  masam: z.string().optional().default(''),
  paksham: z.string().optional().default(''),
  gotram: z.string().optional().default(''),
  fatherId: z.string().nullable().optional().default(null),
  motherId: z.string().nullable().optional().default(null),
  spouseId: z.string().nullable().optional().default(null),
  childrenIds: z.array(z.string()).optional().default([]),
  marriageDate: z.string().nullable().optional().default(null),
  isDeceased: z.boolean().optional().default(false),
  dateOfDeath: z.string().optional().default(''),
  deathTithi: z.string().optional().default(''),
  deathMasam: z.string().optional().default(''),
  deathPaksham: z.string().optional().default(''),
  health: z.array(z.any()).optional().default([]),
  memories: z.array(z.any()).optional().default([]),
  journeyEvents: z.array(z.any()).optional().default([]),
  samskaras: z.array(z.any()).optional().default([]),
  // New fields for migration map
  locations: z.array(z.object({
    place: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    type: z.string().optional(),
  })).optional().default([]),
}).passthrough(); // Allow extra fields for forward compatibility

function validateMember(data) {
  const result = MemberSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, errors: result.error.issues.map(i => i.message) };
  }
  return { valid: true, data: result.data };
}

// === DB HELPERS ===
function getAllMembers() {
  const rows = db.prepare('SELECT data FROM members').all();
  return rows.map(r => JSON.parse(r.data));
}

function getMemberById(id) {
  const row = db.prepare('SELECT data FROM members WHERE id = ?').get(id);
  return row ? JSON.parse(row.data) : null;
}

function saveMemberToDb(member) {
  db.prepare(
    'INSERT OR REPLACE INTO members (id, data, updated_at) VALUES (?, ?, datetime(\'now\'))'
  ).run(member.id, JSON.stringify(member));
}

function deleteMemberFromDb(id) {
  db.prepare('DELETE FROM members WHERE id = ?').run(id);
}

// === SERVER-SIDE RELATIONSHIP SYNC ===
function syncRelationships(members, member) {
  const updated = new Map(members.map(m => [m.id, { ...m }]));
  const parentField = member.gender === 'Male' ? 'fatherId' : member.gender === 'Female' ? 'motherId' : null;

  // 1. Sync father -> childrenIds
  for (const [, m] of updated) {
    if (m.id !== member.fatherId && m.gender === 'Male' && m.childrenIds?.includes(member.id)) {
      m.childrenIds = m.childrenIds.filter(cid => cid !== member.id);
    }
  }
  if (member.fatherId) {
    const father = updated.get(member.fatherId);
    if (father) {
      father.childrenIds = father.childrenIds || [];
      if (!father.childrenIds.includes(member.id)) {
        father.childrenIds.push(member.id);
      }
    }
  }

  // 2. Sync mother -> childrenIds
  for (const [, m] of updated) {
    if (m.id !== member.motherId && m.gender === 'Female' && m.childrenIds?.includes(member.id)) {
      m.childrenIds = m.childrenIds.filter(cid => cid !== member.id);
    }
  }
  if (member.motherId) {
    const mother = updated.get(member.motherId);
    if (mother) {
      mother.childrenIds = mother.childrenIds || [];
      if (!mother.childrenIds.includes(member.id)) {
        mother.childrenIds.push(member.id);
      }
    }
  }

  // 3. Sync spouse (bidirectional)
  for (const [, m] of updated) {
    if (m.id !== member.id && m.spouseId === member.id && m.id !== member.spouseId) {
      m.spouseId = null;
    }
  }
  if (member.spouseId) {
    const spouse = updated.get(member.spouseId);
    if (spouse) {
      spouse.spouseId = member.id;
    }
  }

  // 4. Sync childrenIds -> fatherId/motherId
  if (parentField) {
    for (const [, m] of updated) {
      if (m[parentField] === member.id && !(member.childrenIds || []).includes(m.id)) {
        m[parentField] = null;
      }
    }
    (member.childrenIds || []).forEach(childId => {
      const child = updated.get(childId);
      if (child) {
        child[parentField] = member.id;
      }
    });
  }

  return Array.from(updated.values());
}

// === SMART DUPLICATE DETECTION ===
function normalizeStr(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function findDuplicates(members) {
  const dupes = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const a = members[i], b = members[j];
      let score = 0;

      // Name similarity
      const nameA = normalizeStr(`${a.firstName}${a.lastName}`);
      const nameB = normalizeStr(`${b.firstName}${b.lastName}`);
      const nameDist = levenshtein(nameA, nameB);
      const maxLen = Math.max(nameA.length, nameB.length);
      if (maxLen > 0) {
        const nameSim = 1 - nameDist / maxLen;
        score += nameSim * 50; // 50% weight on name
      }

      // DOB match
      if (a.dob && b.dob && a.dob === b.dob) score += 30;
      else if (a.dob && b.dob) score += 0;

      // Gender match
      if (a.gender && b.gender && a.gender === b.gender) score += 10;

      // Gotram match
      if (a.gotram && b.gotram && a.gotram === b.gotram) score += 10;

      if (score >= 65) {
        dupes.push({
          memberA: { id: a.id, name: `${a.firstName} ${a.lastName || ''}`.trim() },
          memberB: { id: b.id, name: `${b.firstName} ${b.lastName || ''}`.trim() },
          score: Math.round(score),
          reasons: [
            nameDist <= 2 ? 'Similar names' : null,
            a.dob && b.dob && a.dob === b.dob ? 'Same DOB' : null,
            a.gotram && b.gotram && a.gotram === b.gotram ? 'Same gotram' : null,
          ].filter(Boolean),
        });
      }
    }
  }
  return dupes.sort((a, b) => b.score - a.score);
}

// === GEDCOM IMPORT/EXPORT ===
function exportToGedcom(members) {
  const lines = [];
  lines.push('0 HEAD');
  lines.push('1 SOUR Vanshavali');
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5.1');
  lines.push('2 FORM LINEAGE-LINKED');
  lines.push('1 CHAR UTF-8');

  // Track families
  const families = [];

  // Individuals
  members.forEach(m => {
    lines.push(`0 @I${m.id.slice(0, 20)}@ INDI`);
    lines.push(`1 NAME ${m.firstName} /${m.lastName || ''}/`);
    if (m.gender) lines.push(`1 SEX ${m.gender === 'Male' ? 'M' : m.gender === 'Female' ? 'F' : 'U'}`);
    if (m.dob) {
      lines.push('1 BIRT');
      lines.push(`2 DATE ${formatGedcomDate(m.dob)}`);
      if (m.pob) lines.push(`2 PLAC ${m.pob}`);
    }
    if (m.isDeceased) {
      lines.push('1 DEAT');
      if (m.dateOfDeath) lines.push(`2 DATE ${formatGedcomDate(m.dateOfDeath)}`);
    }
    // Custom Vedic tags
    if (m.gotram) lines.push(`1 _GOTRAM ${m.gotram}`);
    if (m.nakshatram) lines.push(`1 _NAKSHATRAM ${m.nakshatram}`);
    if (m.raasi) lines.push(`1 _RAASI ${m.raasi}`);
  });

  // Build families (spouse pairs + parent-child)
  const processedSpouses = new Set();
  members.forEach(m => {
    if (m.spouseId && !processedSpouses.has(m.spouseId)) {
      processedSpouses.add(m.id);
      const famId = `F${families.length + 1}`;
      const husb = m.gender === 'Male' ? m : members.find(x => x.id === m.spouseId);
      const wife = m.gender === 'Female' ? m : members.find(x => x.id === m.spouseId);
      const children = members.filter(c =>
        (husb && c.fatherId === husb.id) || (wife && c.motherId === wife.id)
      );

      families.push({ famId, husb, wife, children, marriageDate: m.marriageDate });
    }
  });

  families.forEach(f => {
    lines.push(`0 @${f.famId}@ FAM`);
    if (f.husb) lines.push(`1 HUSB @I${f.husb.id.slice(0, 20)}@`);
    if (f.wife) lines.push(`1 WIFE @I${f.wife.id.slice(0, 20)}@`);
    if (f.marriageDate) {
      lines.push('1 MARR');
      lines.push(`2 DATE ${formatGedcomDate(f.marriageDate)}`);
    }
    f.children.forEach(c => {
      lines.push(`1 CHIL @I${c.id.slice(0, 20)}@`);
    });
  });

  lines.push('0 TRLR');
  return lines.join('\n');
}

function formatGedcomDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function parseGedcom(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const individuals = {};
  const families = {};
  let current = null;
  let currentType = null;
  let subContext = null;

  for (const line of lines) {
    const match = line.match(/^(\d+)\s+(@\S+@)?\s*(\S+)\s*(.*)?$/);
    if (!match) continue;
    const [, levelStr, tag1, tag2, value] = match;
    const level = parseInt(levelStr);
    const tag = tag1 ? tag2 : tag2;
    const val = tag1 ? (value || '').trim() : (value || '').trim();
    const id = tag1 ? tag1.replace(/@/g, '') : null;

    if (level === 0) {
      subContext = null;
      if (tag === 'INDI') {
        current = { id, firstName: '', lastName: '', gender: '', dob: '', pob: '', isDeceased: false, dateOfDeath: '', gotram: '', nakshatram: '', raasi: '' };
        currentType = 'INDI';
        individuals[id] = current;
      } else if (tag === 'FAM') {
        current = { id, husbId: null, wifeId: null, childIds: [], marriageDate: '' };
        currentType = 'FAM';
        families[id] = current;
      } else {
        current = null;
        currentType = null;
      }
    } else if (level === 1 && current) {
      if (currentType === 'INDI') {
        if (tag === 'NAME') {
          const nameMatch = val.match(/^([^/]*)\/?([^/]*)\/?/);
          if (nameMatch) {
            current.firstName = nameMatch[1].trim();
            current.lastName = nameMatch[2].trim();
          }
        } else if (tag === 'SEX') {
          current.gender = val === 'M' ? 'Male' : val === 'F' ? 'Female' : 'Other';
        } else if (tag === 'BIRT') {
          subContext = 'BIRT';
        } else if (tag === 'DEAT') {
          current.isDeceased = true;
          subContext = 'DEAT';
        } else if (tag === '_GOTRAM') {
          current.gotram = val;
        } else if (tag === '_NAKSHATRAM') {
          current.nakshatram = val;
        } else if (tag === '_RAASI') {
          current.raasi = val;
        }
      } else if (currentType === 'FAM') {
        if (tag === 'HUSB') current.husbId = val.replace(/@/g, '');
        else if (tag === 'WIFE') current.wifeId = val.replace(/@/g, '');
        else if (tag === 'CHIL') current.childIds.push(val.replace(/@/g, ''));
        else if (tag === 'MARR') subContext = 'MARR';
      }
    } else if (level === 2 && current) {
      if (tag === 'DATE') {
        const date = parseGedcomDate(val);
        if (currentType === 'INDI') {
          if (subContext === 'BIRT') current.dob = date;
          else if (subContext === 'DEAT') current.dateOfDeath = date;
        } else if (currentType === 'FAM' && subContext === 'MARR') {
          current.marriageDate = date;
        }
      } else if (tag === 'PLAC' && currentType === 'INDI' && subContext === 'BIRT') {
        current.pob = val;
      }
    }
  }

  // Build members from individuals and families
  const members = [];
  const idMap = {};

  for (const [gedId, indi] of Object.entries(individuals)) {
    const memberId = crypto.randomUUID();
    idMap[gedId] = memberId;
    members.push({
      id: memberId,
      firstName: indi.firstName || 'Unknown',
      lastName: indi.lastName || '',
      gender: indi.gender || 'Male',
      dob: indi.dob || '',
      tob: '',
      pob: indi.pob || '',
      nakshatram: indi.nakshatram || '',
      pada: '',
      raasi: indi.raasi || '',
      tithi: '',
      masam: '',
      paksham: '',
      gotram: indi.gotram || '',
      fatherId: null,
      motherId: null,
      spouseId: null,
      childrenIds: [],
      marriageDate: null,
      isDeceased: indi.isDeceased || false,
      dateOfDeath: indi.dateOfDeath || '',
      deathTithi: '',
      deathMasam: '',
      deathPaksham: '',
      health: [],
      memories: [],
      journeyEvents: [],
      samskaras: [],
      locations: [],
    });
  }

  // Apply family relationships
  for (const fam of Object.values(families)) {
    const husbMemberId = fam.husbId ? idMap[fam.husbId] : null;
    const wifeMemberId = fam.wifeId ? idMap[fam.wifeId] : null;

    if (husbMemberId && wifeMemberId) {
      const husb = members.find(m => m.id === husbMemberId);
      const wife = members.find(m => m.id === wifeMemberId);
      if (husb && wife) {
        husb.spouseId = wifeMemberId;
        wife.spouseId = husbMemberId;
        if (fam.marriageDate) {
          husb.marriageDate = fam.marriageDate;
          wife.marriageDate = fam.marriageDate;
        }
      }
    }

    for (const childGedId of fam.childIds) {
      const childMemberId = idMap[childGedId];
      if (!childMemberId) continue;
      const child = members.find(m => m.id === childMemberId);
      if (!child) continue;

      if (husbMemberId) {
        child.fatherId = husbMemberId;
        const husb = members.find(m => m.id === husbMemberId);
        if (husb) {
          husb.childrenIds = husb.childrenIds || [];
          if (!husb.childrenIds.includes(childMemberId)) husb.childrenIds.push(childMemberId);
        }
      }
      if (wifeMemberId) {
        child.motherId = wifeMemberId;
        const wife = members.find(m => m.id === wifeMemberId);
        if (wife) {
          wife.childrenIds = wife.childrenIds || [];
          if (!wife.childrenIds.includes(childMemberId)) wife.childrenIds.push(childMemberId);
        }
      }
    }
  }

  return members;
}

function parseGedcomDate(dateStr) {
  if (!dateStr) return '';
  const months = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };
  const parts = dateStr.split(/\s+/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1].toUpperCase()] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  if (parts.length === 1 && /^\d{4}$/.test(parts[0])) return `${parts[0]}-01-01`;
  return '';
}

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

// === AUTH ROUTES ===
app.get('/api/auth/status', (req, res) => {
  const hasAuth = existsSync(AUTH_FILE);
  res.json({ isSetup: hasAuth });
});

app.post('/api/auth/setup', (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }
  writeFileSync(AUTH_FILE, JSON.stringify({ hash: hashPassword(password) }), 'utf-8');
  res.json({ success: true });
});

app.post('/api/auth/verify', (req, res) => {
  const { password } = req.body;
  if (!existsSync(AUTH_FILE)) {
    return res.json({ valid: true });
  }
  const auth = JSON.parse(readFileSync(AUTH_FILE, 'utf-8'));
  const valid = auth.hash === hashPassword(password);
  res.json({ valid });
});

// === MEMBER ROUTES ===
app.get('/api/members', (req, res) => {
  res.json(getAllMembers());
});

app.post('/api/members', (req, res) => {
  const members = req.body;
  if (!Array.isArray(members)) {
    return res.status(400).json({ error: 'Expected array of members' });
  }
  // Bulk replace — used by client save & import
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM members').run();
    const insert = db.prepare('INSERT INTO members (id, data) VALUES (?, ?)');
    for (const m of members) {
      insert.run(m.id, JSON.stringify(m));
    }
  });
  tx();
  res.json({ success: true, count: members.length });
});

app.get('/api/members/:id', (req, res) => {
  const member = getMemberById(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

// Save single member with server-side sync
app.put('/api/members/:id', (req, res) => {
  const validation = validateMember(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Validation failed', details: validation.errors });
  }

  const member = validation.data;
  member.id = req.params.id;

  // Merge with existing to preserve fields not in this request
  const existing = getMemberById(req.params.id);
  const merged = existing ? { ...existing, ...member } : member;

  // Save the member first
  saveMemberToDb(merged);

  // Server-side relationship sync
  const allMembers = getAllMembers();
  const synced = syncRelationships(allMembers, merged);

  // Save all synced members
  const tx = db.transaction(() => {
    const update = db.prepare('INSERT OR REPLACE INTO members (id, data, updated_at) VALUES (?, ?, datetime(\'now\'))');
    for (const m of synced) {
      update.run(m.id, JSON.stringify(m));
    }
  });
  tx();

  res.json(merged);
});

// Create new member
app.post('/api/members/new', (req, res) => {
  const validation = validateMember(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Validation failed', details: validation.errors });
  }

  const member = validation.data;
  saveMemberToDb(member);

  // Server-side relationship sync
  const allMembers = getAllMembers();
  const synced = syncRelationships(allMembers, member);
  const tx = db.transaction(() => {
    const update = db.prepare('INSERT OR REPLACE INTO members (id, data, updated_at) VALUES (?, ?, datetime(\'now\'))');
    for (const m of synced) {
      update.run(m.id, JSON.stringify(m));
    }
  });
  tx();

  res.json(member);
});

app.delete('/api/members/:id', (req, res) => {
  const id = req.params.id;

  // Clean up references in other members
  const allMembers = getAllMembers();
  const tx = db.transaction(() => {
    for (const m of allMembers) {
      let changed = false;
      if (m.fatherId === id) { m.fatherId = null; changed = true; }
      if (m.motherId === id) { m.motherId = null; changed = true; }
      if (m.spouseId === id) { m.spouseId = null; changed = true; }
      if (m.childrenIds?.includes(id)) { m.childrenIds = m.childrenIds.filter(cid => cid !== id); changed = true; }
      if (changed) saveMemberToDb(m);
    }
    deleteMemberFromDb(id);
  });
  tx();

  res.json({ success: true });
});

// === EXPORT/IMPORT ===
app.get('/api/export', (req, res) => {
  const format = req.query.format || 'json';
  const members = getAllMembers();

  if (format === 'gedcom') {
    const gedcom = exportToGedcom(members);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=vanshavali-export.ged');
    return res.send(gedcom);
  }

  res.setHeader('Content-Disposition', 'attachment; filename=vanshavali-export.json');
  res.json(members);
});

app.post('/api/import', (req, res) => {
  const { format, data } = req.body;

  if (format === 'gedcom') {
    if (typeof data !== 'string') {
      return res.status(400).json({ error: 'GEDCOM data must be a string' });
    }
    const members = parseGedcom(data);
    const tx = db.transaction(() => {
      const insert = db.prepare('INSERT OR REPLACE INTO members (id, data) VALUES (?, ?)');
      for (const m of members) {
        insert.run(m.id, JSON.stringify(m));
      }
    });
    tx();
    return res.json({ success: true, count: members.length, members });
  }

  // JSON import (backward compatible)
  const members = Array.isArray(req.body) ? req.body : data;
  if (!Array.isArray(members)) {
    return res.status(400).json({ error: 'Expected array of members' });
  }
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM members').run();
    const insert = db.prepare('INSERT INTO members (id, data) VALUES (?, ?)');
    for (const m of members) {
      insert.run(m.id, JSON.stringify(m));
    }
  });
  tx();
  res.json({ success: true, count: members.length });
});

// === DUPLICATE DETECTION ===
app.get('/api/duplicates', (req, res) => {
  const members = getAllMembers();
  const duplicates = findDuplicates(members);
  res.json(duplicates);
});

// === STORIES ===
app.get('/api/stories', (req, res) => {
  const rows = db.prepare('SELECT * FROM stories ORDER BY updated_at DESC').all();
  res.json(rows.map(r => ({
    ...r,
    memberIds: JSON.parse(r.member_ids),
    tags: JSON.parse(r.tags),
  })));
});

app.post('/api/stories', (req, res) => {
  const { id, title, content, memberIds, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  const storyId = id || crypto.randomUUID();
  db.prepare(
    'INSERT OR REPLACE INTO stories (id, title, content, member_ids, tags, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))'
  ).run(storyId, title, content, JSON.stringify(memberIds || []), JSON.stringify(tags || []));
  res.json({ success: true, id: storyId });
});

app.delete('/api/stories/:id', (req, res) => {
  db.prepare('DELETE FROM stories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// === PHOTOS ===
app.get('/api/photos/:memberId', (req, res) => {
  const rows = db.prepare('SELECT * FROM photos WHERE member_id = ? ORDER BY date_taken DESC, created_at DESC').all(req.params.memberId);
  res.json(rows);
});

app.post('/api/photos', (req, res) => {
  const { memberId, imageData, caption, dateTaken } = req.body;
  if (!memberId || !imageData) {
    return res.status(400).json({ error: 'memberId and imageData are required' });
  }

  const photoId = crypto.randomUUID();
  const ext = imageData.startsWith('data:image/png') ? '.png' : '.jpg';
  const filename = `${photoId}${ext}`;
  const filepath = join(PHOTOS_DIR, filename);

  // Save base64 image to file
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
  writeFileSync(filepath, Buffer.from(base64Data, 'base64'));

  db.prepare(
    'INSERT INTO photos (id, member_id, filename, caption, date_taken) VALUES (?, ?, ?, ?, ?)'
  ).run(photoId, memberId, filename, caption || '', dateTaken || '');

  res.json({ success: true, id: photoId, filename });
});

app.get('/api/photos/file/:filename', (req, res) => {
  const filepath = join(PHOTOS_DIR, req.params.filename);
  if (!existsSync(filepath)) return res.status(404).json({ error: 'Photo not found' });
  res.sendFile(filepath);
});

app.delete('/api/photos/:id', (req, res) => {
  const photo = db.prepare('SELECT filename FROM photos WHERE id = ?').get(req.params.id);
  if (photo) {
    const filepath = join(PHOTOS_DIR, photo.filename);
    if (existsSync(filepath)) unlinkSync(filepath);
  }
  db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// === SEARCH (Global) ===
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json({ members: [], stories: [] });

  const members = getAllMembers();
  const matchedMembers = members.filter(m => {
    const searchable = `${m.firstName} ${m.lastName || ''} ${m.gotram || ''} ${m.nakshatram || ''} ${m.pob || ''}`.toLowerCase();
    return searchable.includes(q);
  }).map(m => ({
    id: m.id,
    name: `${m.firstName} ${m.lastName || ''}`.trim(),
    type: 'member',
    detail: [m.gotram, m.pob].filter(Boolean).join(' | '),
  }));

  const stories = db.prepare('SELECT id, title FROM stories WHERE LOWER(title) LIKE ? OR LOWER(content) LIKE ?')
    .all(`%${q}%`, `%${q}%`)
    .map(s => ({ id: s.id, name: s.title, type: 'story', detail: 'Story' }));

  res.json({ results: [...matchedMembers, ...stories] });
});

// === SERVE BUILT REACT APP ===
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('/{*path}', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
}

// === START ===
const server = app.listen(PORT, () => {
  console.log(`\n  Vanshavali API server running at http://localhost:${PORT}`);
  console.log(`  Database: ${DB_FILE}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ERROR: Port ${PORT} is already in use.`);
    console.error(`  Close the other instance or kill the process using port ${PORT}.\n`);
  } else {
    console.error(`\n  Server error: ${err.message}\n`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => { db.close(); process.exit(0); });
process.on('SIGTERM', () => { db.close(); process.exit(0); });
