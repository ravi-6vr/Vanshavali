/**
 * Seed script — populates the database with a fictional demo family.
 *
 * Usage:
 *   node scripts/seed-demo.js          # Seed only if DB is empty
 *   node scripts/seed-demo.js --force  # Wipe and re-seed
 *
 * All names, dates, and details are entirely fictional.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data-json');
const DB_FILE = join(DATA_DIR, 'vanshavali.db');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

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

const force = process.argv.includes('--force');
const count = db.prepare('SELECT COUNT(*) as c FROM members').get().c;

if (count > 0 && !force) {
  console.log(`\n  Database already has ${count} members. Use --force to wipe and re-seed.\n`);
  db.close();
  process.exit(0);
}

if (force) {
  db.exec('DELETE FROM members; DELETE FROM stories; DELETE FROM photos;');
  console.log('  Cleared existing data.');
}

// === GENERATE IDs ===
const ids = {};
const names = [
  'grandfather', 'grandmother',
  'father', 'mother',
  'uncle', 'aunt',
  'self', 'spouse',
  'brother', 'sisterInLaw',
  'sister', 'brotherInLaw',
  'son', 'daughter',
  'cousin1', 'cousin2',
  'nephew',
  'mgrandfather', 'mgrandmother',
];
names.forEach(n => { ids[n] = randomUUID(); });

// === DEMO MEMBERS ===
// A fictional Telugu Brahmin family — the Shastri family from Rajahmundry
const members = [
  // === GENERATION 1 — Grandparents (Paternal) ===
  {
    id: ids.grandfather,
    firstName: 'Venkata', lastName: 'Shastri',
    gender: 'Male', dob: '1935-03-12', pob: 'Rajahmundry',
    gotram: 'Bharadwaja', nakshatram: 'Rohini', pada: '2', raasi: 'Vrishabha',
    tithi: 'Panchami', masam: 'Phalguna', paksham: 'Shukla',
    fatherId: null, motherId: null, spouseId: ids.grandmother,
    childrenIds: [ids.father, ids.uncle],
    marriageDate: '1958-05-20',
    isDeceased: true, dateOfDeath: '2005-11-14',
    deathTithi: 'Dwadashi', deathMasam: 'Kartika', deathPaksham: 'Shukla',
    health: [{ condition: 'Diabetes Type 2', diagnosed: '1985', notes: 'Managed with diet' }],
    memories: [], journeyEvents: [
      { event: 'Born in Rajahmundry', date: '1935-03-12', description: 'Born in a family of Sanskrit scholars' },
      { event: 'Married Saraswati', date: '1958-05-20', description: 'Traditional Vedic wedding' },
      { event: 'Retired from teaching', date: '1995-03-31', description: 'Retired as Head of Sanskrit Department' },
    ],
    samskaras: [
      { name: 'Namakarana', date: '1935-03-24', notes: 'Named after Lord Venkateshwara' },
      { name: 'Upanayana', date: '1946-04-10', notes: 'Sacred thread ceremony at age 11' },
      { name: 'Vivaha', date: '1958-05-20', notes: '' },
      { name: 'Antyeshti', date: '2005-11-14', notes: 'Performed by eldest son Ramachandra' },
    ],
    locations: [
      { place: 'Rajahmundry', lat: 17.0005, lng: 81.8040, from: '1935', to: '1960', type: 'birth' },
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '1960', to: '2005', type: 'residence' },
    ],
  },
  {
    id: ids.grandmother,
    firstName: 'Saraswati', lastName: 'Shastri',
    gender: 'Female', dob: '1940-08-25', pob: 'Kakinada',
    gotram: 'Vasistha', nakshatram: 'Hasta', pada: '3', raasi: 'Kanya',
    tithi: 'Ashtami', masam: 'Shravana', paksham: 'Krishna',
    fatherId: null, motherId: null, spouseId: ids.grandfather,
    childrenIds: [ids.father, ids.uncle],
    marriageDate: '1958-05-20',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [{ condition: 'Arthritis', diagnosed: '2010', notes: 'Knee replacement in 2018' }],
    memories: [], journeyEvents: [],
    samskaras: [
      { name: 'Namakarana', date: '1940-09-05', notes: '' },
      { name: 'Vivaha', date: '1958-05-20', notes: '' },
    ],
    locations: [
      { place: 'Kakinada', lat: 16.9891, lng: 82.2475, from: '1940', to: '1958', type: 'birth' },
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '1958', to: '', type: 'residence' },
    ],
  },

  // === GENERATION 1 — Grandparents (Maternal) ===
  {
    id: ids.mgrandfather,
    firstName: 'Subrahmanyam', lastName: 'Iyer',
    gender: 'Male', dob: '1938-01-15', pob: 'Vijayawada',
    gotram: 'Kashyapa', nakshatram: 'Pushya', pada: '1', raasi: 'Karka',
    tithi: 'Pratipada', masam: 'Pausha', paksham: 'Shukla',
    fatherId: null, motherId: null, spouseId: ids.mgrandmother,
    childrenIds: [ids.mother],
    marriageDate: '1960-02-14',
    isDeceased: true, dateOfDeath: '2012-06-30',
    deathTithi: 'Ekadashi', deathMasam: 'Jyeshtha', deathPaksham: 'Shukla',
    health: [], memories: [], journeyEvents: [], samskaras: [],
    locations: [
      { place: 'Vijayawada', lat: 16.5062, lng: 80.6480, from: '1938', to: '2012', type: 'birth' },
    ],
  },
  {
    id: ids.mgrandmother,
    firstName: 'Kamala', lastName: 'Iyer',
    gender: 'Female', dob: '1942-11-05', pob: 'Guntur',
    gotram: 'Atreya', nakshatram: 'Anuradha', pada: '2', raasi: 'Vrischika',
    tithi: 'Navami', masam: 'Kartika', paksham: 'Krishna',
    fatherId: null, motherId: null, spouseId: ids.mgrandfather,
    childrenIds: [ids.mother],
    marriageDate: '1960-02-14',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [], samskaras: [],
    locations: [
      { place: 'Guntur', lat: 16.3067, lng: 80.4365, from: '1942', to: '1960', type: 'birth' },
      { place: 'Vijayawada', lat: 16.5062, lng: 80.6480, from: '1960', to: '', type: 'residence' },
    ],
  },

  // === GENERATION 2 — Parents & Uncle ===
  {
    id: ids.father,
    firstName: 'Ramachandra', lastName: 'Shastri',
    gender: 'Male', dob: '1962-07-08', pob: 'Hyderabad',
    gotram: 'Bharadwaja', nakshatram: 'Magha', pada: '1', raasi: 'Simha',
    tithi: 'Chaturthi', masam: 'Ashadha', paksham: 'Shukla',
    fatherId: ids.grandfather, motherId: ids.grandmother, spouseId: ids.mother,
    childrenIds: [ids.self, ids.brother, ids.sister],
    marriageDate: '1988-12-10',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [{ condition: 'Hypertension', diagnosed: '2015', notes: 'On medication' }],
    memories: [], journeyEvents: [
      { event: 'Graduated IIT Madras', date: '1984-05-15', description: 'B.Tech in Electrical Engineering' },
      { event: 'Joined BHEL', date: '1984-07-01', description: 'Engineer at Bharat Heavy Electricals' },
      { event: 'Married Lakshmi', date: '1988-12-10', description: '' },
    ],
    samskaras: [
      { name: 'Upanayana', date: '1973-04-15', notes: '' },
      { name: 'Vivaha', date: '1988-12-10', notes: '' },
    ],
    locations: [
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '1962', to: '1980', type: 'birth' },
      { place: 'Chennai', lat: 13.0827, lng: 80.2707, from: '1980', to: '1984', type: 'education' },
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '1984', to: '', type: 'residence' },
    ],
  },
  {
    id: ids.mother,
    firstName: 'Lakshmi', lastName: 'Shastri',
    gender: 'Female', dob: '1965-04-22', pob: 'Vijayawada',
    gotram: 'Kashyapa', nakshatram: 'Swati', pada: '4', raasi: 'Tula',
    tithi: 'Tritiya', masam: 'Chaitra', paksham: 'Shukla',
    fatherId: ids.mgrandfather, motherId: ids.mgrandmother, spouseId: ids.father,
    childrenIds: [ids.self, ids.brother, ids.sister],
    marriageDate: '1988-12-10',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [],
    samskaras: [
      { name: 'Vivaha', date: '1988-12-10', notes: '' },
    ],
    locations: [
      { place: 'Vijayawada', lat: 16.5062, lng: 80.6480, from: '1965', to: '1988', type: 'birth' },
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '1988', to: '', type: 'residence' },
    ],
  },
  {
    id: ids.uncle,
    firstName: 'Srinivasa', lastName: 'Shastri',
    gender: 'Male', dob: '1966-02-18', pob: 'Hyderabad',
    gotram: 'Bharadwaja', nakshatram: 'Uttara Phalguni', pada: '2', raasi: 'Kanya',
    tithi: 'Saptami', masam: 'Magha', paksham: 'Krishna',
    fatherId: ids.grandfather, motherId: ids.grandmother, spouseId: ids.aunt,
    childrenIds: [ids.cousin1, ids.cousin2],
    marriageDate: '1992-06-05',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [
      { event: 'Moved to Bangalore', date: '1990-01-15', description: 'Software career at Infosys' },
    ],
    samskaras: [],
    locations: [
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '1966', to: '1990', type: 'birth' },
      { place: 'Bangalore', lat: 12.9716, lng: 77.5946, from: '1990', to: '', type: 'residence' },
    ],
  },
  {
    id: ids.aunt,
    firstName: 'Padma', lastName: 'Shastri',
    gender: 'Female', dob: '1970-09-12', pob: 'Tirupati',
    gotram: 'Gautama', nakshatram: 'Chitra', pada: '1', raasi: 'Kanya',
    tithi: 'Shashthi', masam: 'Bhadrapada', paksham: 'Shukla',
    fatherId: null, motherId: null, spouseId: ids.uncle,
    childrenIds: [ids.cousin1, ids.cousin2],
    marriageDate: '1992-06-05',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [], samskaras: [],
    locations: [
      { place: 'Tirupati', lat: 13.6288, lng: 79.4192, from: '1970', to: '1992', type: 'birth' },
      { place: 'Bangalore', lat: 12.9716, lng: 77.5946, from: '1992', to: '', type: 'residence' },
    ],
  },

  // === GENERATION 3 — Self, Siblings, Cousins ===
  {
    id: ids.self,
    firstName: 'Aditya', lastName: 'Shastri',
    gender: 'Male', dob: '1990-10-15', pob: 'Hyderabad',
    gotram: 'Bharadwaja', nakshatram: 'Ashwini', pada: '3', raasi: 'Mesha',
    tithi: 'Dvitiya', masam: 'Ashwin', paksham: 'Krishna',
    fatherId: ids.father, motherId: ids.mother, spouseId: ids.spouse,
    childrenIds: [ids.son, ids.daughter],
    marriageDate: '2018-11-25',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [],
    memories: [{ title: 'First bike ride', description: 'Got my first bicycle on 8th birthday' }],
    journeyEvents: [
      { event: 'Born in Hyderabad', date: '1990-10-15', description: '' },
      { event: 'Graduated BITS Pilani', date: '2012-06-15', description: 'B.E. Computer Science' },
      { event: 'Joined Microsoft', date: '2012-08-01', description: 'Software Engineer in Hyderabad' },
      { event: 'Married Priya', date: '2018-11-25', description: 'Wedding in Hyderabad' },
    ],
    samskaras: [
      { name: 'Namakarana', date: '1990-10-27', notes: '' },
      { name: 'Annaprashana', date: '1991-04-15', notes: '' },
      { name: 'Upanayana', date: '2001-05-20', notes: '' },
      { name: 'Vivaha', date: '2018-11-25', notes: '' },
    ],
    locations: [
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '1990', to: '2008', type: 'birth' },
      { place: 'Pilani', lat: 28.3670, lng: 75.6040, from: '2008', to: '2012', type: 'education' },
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '2012', to: '', type: 'residence' },
    ],
  },
  {
    id: ids.spouse,
    firstName: 'Priya', lastName: 'Shastri',
    gender: 'Female', dob: '1993-03-08', pob: 'Visakhapatnam',
    gotram: 'Parasara', nakshatram: 'Punarvasu', pada: '4', raasi: 'Karka',
    tithi: 'Chaturdashi', masam: 'Phalguna', paksham: 'Shukla',
    fatherId: null, motherId: null, spouseId: ids.self,
    childrenIds: [ids.son, ids.daughter],
    marriageDate: '2018-11-25',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [],
    samskaras: [
      { name: 'Vivaha', date: '2018-11-25', notes: '' },
    ],
    locations: [
      { place: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, from: '1993', to: '2018', type: 'birth' },
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '2018', to: '', type: 'residence' },
    ],
  },
  {
    id: ids.brother,
    firstName: 'Karthik', lastName: 'Shastri',
    gender: 'Male', dob: '1993-06-20', pob: 'Hyderabad',
    gotram: 'Bharadwaja', nakshatram: 'Mrigashira', pada: '1', raasi: 'Vrishabha',
    tithi: 'Pratipada', masam: 'Jyeshtha', paksham: 'Shukla',
    fatherId: ids.father, motherId: ids.mother, spouseId: ids.sisterInLaw,
    childrenIds: [ids.nephew],
    marriageDate: '2022-02-14',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [
      { event: 'Graduated NIT Warangal', date: '2015-05-20', description: 'B.Tech Mechanical Engineering' },
    ],
    samskaras: [
      { name: 'Upanayana', date: '2004-06-10', notes: '' },
      { name: 'Vivaha', date: '2022-02-14', notes: '' },
    ],
    locations: [
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '1993', to: '', type: 'birth' },
    ],
  },
  {
    id: ids.sisterInLaw,
    firstName: 'Meera', lastName: 'Shastri',
    gender: 'Female', dob: '1995-12-01', pob: 'Pune',
    gotram: 'Kaundinyasa', nakshatram: 'Jyeshtha', pada: '3', raasi: 'Vrischika',
    tithi: 'Dashami', masam: 'Margashirsha', paksham: 'Krishna',
    fatherId: null, motherId: null, spouseId: ids.brother,
    childrenIds: [ids.nephew],
    marriageDate: '2022-02-14',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [], samskaras: [],
    locations: [
      { place: 'Pune', lat: 18.5204, lng: 73.8567, from: '1995', to: '2022', type: 'birth' },
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '2022', to: '', type: 'residence' },
    ],
  },
  {
    id: ids.sister,
    firstName: 'Ananya', lastName: 'Reddy',
    gender: 'Female', dob: '1996-01-30', pob: 'Hyderabad',
    gotram: 'Bharadwaja', nakshatram: 'Shravana', pada: '2', raasi: 'Makara',
    tithi: 'Ekadashi', masam: 'Pausha', paksham: 'Shukla',
    fatherId: ids.father, motherId: ids.mother, spouseId: ids.brotherInLaw,
    childrenIds: [],
    marriageDate: '2023-05-15',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [], samskaras: [],
    locations: [
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '1996', to: '', type: 'birth' },
    ],
  },
  {
    id: ids.brotherInLaw,
    firstName: 'Vikram', lastName: 'Reddy',
    gender: 'Male', dob: '1994-08-05', pob: 'Warangal',
    gotram: 'Mudgala', nakshatram: 'Purva Phalguni', pada: '4', raasi: 'Simha',
    tithi: 'Trayodashi', masam: 'Shravana', paksham: 'Krishna',
    fatherId: null, motherId: null, spouseId: ids.sister,
    childrenIds: [],
    marriageDate: '2023-05-15',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [], samskaras: [],
    locations: [
      { place: 'Warangal', lat: 17.9784, lng: 79.5941, from: '1994', to: '', type: 'birth' },
    ],
  },
  {
    id: ids.cousin1,
    firstName: 'Nikhil', lastName: 'Shastri',
    gender: 'Male', dob: '1994-04-10', pob: 'Bangalore',
    gotram: 'Bharadwaja', nakshatram: 'Ardra', pada: '2', raasi: 'Mithuna',
    tithi: 'Chaturthi', masam: 'Chaitra', paksham: 'Krishna',
    fatherId: ids.uncle, motherId: ids.aunt, spouseId: null,
    childrenIds: [],
    marriageDate: null,
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [], samskaras: [],
    locations: [
      { place: 'Bangalore', lat: 12.9716, lng: 77.5946, from: '1994', to: '', type: 'birth' },
    ],
  },
  {
    id: ids.cousin2,
    firstName: 'Divya', lastName: 'Shastri',
    gender: 'Female', dob: '1998-07-22', pob: 'Bangalore',
    gotram: 'Bharadwaja', nakshatram: 'Vishakha', pada: '3', raasi: 'Tula',
    tithi: 'Ashtami', masam: 'Ashadha', paksham: 'Shukla',
    fatherId: ids.uncle, motherId: ids.aunt, spouseId: null,
    childrenIds: [],
    marriageDate: null,
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [], samskaras: [],
    locations: [
      { place: 'Bangalore', lat: 12.9716, lng: 77.5946, from: '1998', to: '', type: 'birth' },
    ],
  },

  // === GENERATION 4 — Children ===
  {
    id: ids.son,
    firstName: 'Arjun', lastName: 'Shastri',
    gender: 'Male', dob: '2020-08-15', pob: 'Hyderabad',
    gotram: 'Bharadwaja', nakshatram: 'Krittika', pada: '2', raasi: 'Vrishabha',
    tithi: 'Panchami', masam: 'Shravana', paksham: 'Krishna',
    fatherId: ids.self, motherId: ids.spouse, spouseId: null,
    childrenIds: [],
    marriageDate: null,
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [
      { event: 'Born on Independence Day', date: '2020-08-15', description: 'Born at Apollo Hospital, Hyderabad' },
    ],
    samskaras: [
      { name: 'Namakarana', date: '2020-08-27', notes: 'Named Arjun' },
      { name: 'Annaprashana', date: '2021-02-15', notes: '' },
    ],
    locations: [
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '2020', to: '', type: 'birth' },
    ],
  },
  {
    id: ids.daughter,
    firstName: 'Sita', lastName: 'Shastri',
    gender: 'Female', dob: '2023-01-26', pob: 'Hyderabad',
    gotram: 'Bharadwaja', nakshatram: 'Mula', pada: '1', raasi: 'Dhanus',
    tithi: 'Panchami', masam: 'Magha', paksham: 'Shukla',
    fatherId: ids.self, motherId: ids.spouse, spouseId: null,
    childrenIds: [],
    marriageDate: null,
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [],
    samskaras: [
      { name: 'Namakarana', date: '2023-02-07', notes: '' },
    ],
    locations: [
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '2023', to: '', type: 'birth' },
    ],
  },
  {
    id: ids.nephew,
    firstName: 'Rohan', lastName: 'Shastri',
    gender: 'Male', dob: '2024-03-21', pob: 'Hyderabad',
    gotram: 'Bharadwaja', nakshatram: 'Revati', pada: '4', raasi: 'Meena',
    tithi: 'Ekadashi', masam: 'Phalguna', paksham: 'Shukla',
    fatherId: ids.brother, motherId: ids.sisterInLaw, spouseId: null,
    childrenIds: [],
    marriageDate: null,
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
    health: [], memories: [], journeyEvents: [],
    samskaras: [],
    locations: [
      { place: 'Hyderabad', lat: 17.3850, lng: 78.4867, from: '2024', to: '', type: 'birth' },
    ],
  },
];

// === INSERT INTO DB ===
const insert = db.prepare('INSERT OR REPLACE INTO members (id, data) VALUES (?, ?)');
const tx = db.transaction((items) => {
  for (const m of items) {
    insert.run(m.id, JSON.stringify(m));
  }
});
tx(members);

// === INSERT DEMO STORIES ===
const storyInsert = db.prepare(
  'INSERT OR REPLACE INTO stories (id, title, content, member_ids, tags) VALUES (?, ?, ?, ?, ?)'
);
const storyTx = db.transaction(() => {
  storyInsert.run(
    randomUUID(),
    'The Great Migration from Rajahmundry',
    'In 1960, Venkata Shastri moved his young family from the banks of the Godavari in Rajahmundry to the bustling city of Hyderabad. He had secured a position as a Sanskrit lecturer at Osmania University. The move was difficult — leaving behind generations of roots — but it opened doors for the next generation. His sons Ramachandra and Srinivasa both went on to pursue engineering, a path that would have been harder in the small town.',
    JSON.stringify([ids.grandfather, ids.father, ids.uncle]),
    JSON.stringify(['migration', 'family-history', 'education'])
  );
  storyInsert.run(
    randomUUID(),
    'Grandfather\'s Sanskrit Shlokas',
    'Every evening, Venkata Thatha would sit on the veranda and recite shlokas from the Bhagavad Gita. The grandchildren would gather around, not understanding a word, but mesmerized by the rhythm of the ancient verses. He believed that the vibrations of Sanskrit had healing powers. Even today, Aditya can recite the first five verses of Chapter 2 from memory — a gift from those twilight sessions.',
    JSON.stringify([ids.grandfather, ids.self]),
    JSON.stringify(['memories', 'culture', 'vedic'])
  );
  storyInsert.run(
    randomUUID(),
    'Wedding of Aditya & Priya',
    'The wedding was held at Shilparamam in Hyderabad on November 25, 2018. It was a traditional Vedic ceremony with the full Saptapadi ritual. Grandmother Saraswati insisted on the traditional pelli-koduku procession, and the entire Shastri clan gathered — some traveling from as far as Bangalore and Chennai. The gotram pravara recitation was a highlight, tracing the Bharadwaja lineage through Angirasa and Barhaspatya.',
    JSON.stringify([ids.self, ids.spouse, ids.grandmother]),
    JSON.stringify(['wedding', 'celebration', 'vedic'])
  );
});
storyTx();

console.log(`\n  Seeded ${members.length} demo members and 3 stories.`);
console.log(`  Database: ${DB_FILE}\n`);

db.close();
