// === NAKSHATRAM (27 Lunar Constellations) with Raasi mapping by Pada ===
export const NAKSHATRAM_LIST = [
  { name: 'Ashwini', raasiByPada: ['Mesha', 'Mesha', 'Mesha', 'Mesha'], deity: 'Ashwini Kumaras', symbol: 'Horse head' },
  { name: 'Bharani', raasiByPada: ['Mesha', 'Mesha', 'Mesha', 'Mesha'], deity: 'Yama', symbol: 'Yoni' },
  { name: 'Krittika', raasiByPada: ['Mesha', 'Vrishabha', 'Vrishabha', 'Vrishabha'], deity: 'Agni', symbol: 'Razor/Flame' },
  { name: 'Rohini', raasiByPada: ['Vrishabha', 'Vrishabha', 'Vrishabha', 'Vrishabha'], deity: 'Brahma', symbol: 'Chariot/Ox cart' },
  { name: 'Mrigashira', raasiByPada: ['Vrishabha', 'Vrishabha', 'Mithuna', 'Mithuna'], deity: 'Soma/Chandra', symbol: 'Deer head' },
  { name: 'Ardra', raasiByPada: ['Mithuna', 'Mithuna', 'Mithuna', 'Mithuna'], deity: 'Rudra', symbol: 'Teardrop/Diamond' },
  { name: 'Punarvasu', raasiByPada: ['Mithuna', 'Mithuna', 'Mithuna', 'Karka'], deity: 'Aditi', symbol: 'Bow and quiver' },
  { name: 'Pushya', raasiByPada: ['Karka', 'Karka', 'Karka', 'Karka'], deity: 'Brihaspati', symbol: 'Lotus/Arrow' },
  { name: 'Ashlesha', raasiByPada: ['Karka', 'Karka', 'Karka', 'Karka'], deity: 'Naga', symbol: 'Serpent' },
  { name: 'Magha', raasiByPada: ['Simha', 'Simha', 'Simha', 'Simha'], deity: 'Pitris', symbol: 'Royal throne' },
  { name: 'Purva Phalguni', raasiByPada: ['Simha', 'Simha', 'Simha', 'Simha'], deity: 'Bhaga', symbol: 'Front legs of bed' },
  { name: 'Uttara Phalguni', raasiByPada: ['Simha', 'Kanya', 'Kanya', 'Kanya'], deity: 'Aryaman', symbol: 'Back legs of bed' },
  { name: 'Hasta', raasiByPada: ['Kanya', 'Kanya', 'Kanya', 'Kanya'], deity: 'Savitar', symbol: 'Hand/Fist' },
  { name: 'Chitra', raasiByPada: ['Kanya', 'Kanya', 'Tula', 'Tula'], deity: 'Vishwakarma', symbol: 'Bright jewel' },
  { name: 'Swati', raasiByPada: ['Tula', 'Tula', 'Tula', 'Tula'], deity: 'Vayu', symbol: 'Shoot of plant' },
  { name: 'Vishakha', raasiByPada: ['Tula', 'Tula', 'Tula', 'Vrischika'], deity: 'Indra-Agni', symbol: 'Triumphal arch' },
  { name: 'Anuradha', raasiByPada: ['Vrischika', 'Vrischika', 'Vrischika', 'Vrischika'], deity: 'Mitra', symbol: 'Lotus' },
  { name: 'Jyeshtha', raasiByPada: ['Vrischika', 'Vrischika', 'Vrischika', 'Vrischika'], deity: 'Indra', symbol: 'Circular amulet' },
  { name: 'Mula', raasiByPada: ['Dhanus', 'Dhanus', 'Dhanus', 'Dhanus'], deity: 'Nirriti', symbol: 'Bunch of roots' },
  { name: 'Purva Ashadha', raasiByPada: ['Dhanus', 'Dhanus', 'Dhanus', 'Dhanus'], deity: 'Apas', symbol: 'Elephant tusk/Fan' },
  { name: 'Uttara Ashadha', raasiByPada: ['Dhanus', 'Makara', 'Makara', 'Makara'], deity: 'Vishvedevas', symbol: 'Elephant tusk/Planks' },
  { name: 'Shravana', raasiByPada: ['Makara', 'Makara', 'Makara', 'Makara'], deity: 'Vishnu', symbol: 'Ear/Three footprints' },
  { name: 'Dhanishta', raasiByPada: ['Makara', 'Makara', 'Kumbha', 'Kumbha'], deity: 'Vasus', symbol: 'Drum' },
  { name: 'Shatabhisha', raasiByPada: ['Kumbha', 'Kumbha', 'Kumbha', 'Kumbha'], deity: 'Varuna', symbol: 'Empty circle' },
  { name: 'Purva Bhadrapada', raasiByPada: ['Kumbha', 'Kumbha', 'Kumbha', 'Meena'], deity: 'Aja Ekapada', symbol: 'Sword/Front of funeral cot' },
  { name: 'Uttara Bhadrapada', raasiByPada: ['Meena', 'Meena', 'Meena', 'Meena'], deity: 'Ahir Budhnya', symbol: 'Back of funeral cot' },
  { name: 'Revati', raasiByPada: ['Meena', 'Meena', 'Meena', 'Meena'], deity: 'Pushan', symbol: 'Fish/Drum' },
];

// === RAASI (12 Zodiac Signs) ===
export const RAASI_LIST = [
  { name: 'Mesha', english: 'Aries', element: 'Fire', lord: 'Mangal (Mars)' },
  { name: 'Vrishabha', english: 'Taurus', element: 'Earth', lord: 'Shukra (Venus)' },
  { name: 'Mithuna', english: 'Gemini', element: 'Air', lord: 'Budha (Mercury)' },
  { name: 'Karka', english: 'Cancer', element: 'Water', lord: 'Chandra (Moon)' },
  { name: 'Simha', english: 'Leo', element: 'Fire', lord: 'Surya (Sun)' },
  { name: 'Kanya', english: 'Virgo', element: 'Earth', lord: 'Budha (Mercury)' },
  { name: 'Tula', english: 'Libra', element: 'Air', lord: 'Shukra (Venus)' },
  { name: 'Vrischika', english: 'Scorpio', element: 'Water', lord: 'Mangal (Mars)' },
  { name: 'Dhanus', english: 'Sagittarius', element: 'Fire', lord: 'Guru (Jupiter)' },
  { name: 'Makara', english: 'Capricorn', element: 'Earth', lord: 'Shani (Saturn)' },
  { name: 'Kumbha', english: 'Aquarius', element: 'Air', lord: 'Shani (Saturn)' },
  { name: 'Meena', english: 'Pisces', element: 'Water', lord: 'Guru (Jupiter)' },
];

// === TITHI (Lunar Days) ===
export const TITHI_LIST = [
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima', 'Amavasya',
];

// === MASAM (Lunar Months) ===
export const MASAM_LIST = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
];

// === PAKSHAM (Moon Phase) ===
export const PAKSHAM_LIST = ['Shukla', 'Krishna'];

// === GOTRAM with Pravara (Rishi Lineage) ===
export const GOTRAM_DATA = [
  { name: 'Sandilyasa', pravara: ['Sandilyasa', 'Asita', 'Devala'], rishi: 'Sandilya' },
  { name: 'Bharadwaja', pravara: ['Angirasa', 'Barhaspatya', 'Bharadwaja'], rishi: 'Bharadwaja' },
  { name: 'Vasistha', pravara: ['Vasistha', 'Indrapramada', 'Abharadwasu'], rishi: 'Vasistha' },
  { name: 'Kaundinyasa', pravara: ['Vasistha', 'Maitravaruna', 'Kaundinyasa'], rishi: 'Kaundinya' },
  { name: 'Kashyapa', pravara: ['Kashyapa', 'Avatsara', 'Naidhruvi'], rishi: 'Kashyapa' },
  { name: 'Atreya', pravara: ['Atreya', 'Archananasa', 'Syavashva'], rishi: 'Atri' },
  { name: 'Gautama', pravara: ['Angirasa', 'Ayasya', 'Gautama'], rishi: 'Gautama' },
  { name: 'Jamadagni', pravara: ['Bhargava', 'Chyavana', 'Apnavana', 'Aurva', 'Jamadagni'], rishi: 'Jamadagni' },
  { name: 'Vishwamitra', pravara: ['Vishwamitra', 'Aghmarshana', 'Kaushika'], rishi: 'Vishwamitra' },
  { name: 'Mudgala', pravara: ['Angirasa', 'Bharmyashva', 'Mudgala'], rishi: 'Mudgala' },
  { name: 'Harita', pravara: ['Angirasa', 'Ambarisha', 'Yuvanashva'], rishi: 'Harita' },
  { name: 'Srivatsa', pravara: ['Bhargava', 'Chyavana', 'Apnavana', 'Aurva', 'Jamadagni'], rishi: 'Srivatsa' },
  { name: 'Parasara', pravara: ['Vasistha', 'Shaktya', 'Parasharya'], rishi: 'Parasara' },
  { name: 'Kaushika', pravara: ['Vishwamitra', 'Aghmarshana', 'Kaushika'], rishi: 'Kaushika' },
  { name: 'Agastya', pravara: ['Agastya', 'Darbhayana', 'Idhmavaaha'], rishi: 'Agastya' },
  { name: 'Nandilasa', pravara: ['Kashyapa', 'Avatsara', 'Nandilasa'], rishi: 'Nandilasa' },
];

// === SAMSKARAS (16 Hindu Sacraments) ===
export const SAMSKARA_LIST = [
  { name: 'Garbhadhana', meaning: 'Conception', stage: 'Pre-birth' },
  { name: 'Pumsavana', meaning: 'Quickening (fetus protection)', stage: 'Pre-birth' },
  { name: 'Simantonnayana', meaning: 'Baby shower', stage: 'Pre-birth' },
  { name: 'Jatakarma', meaning: 'Birth rites', stage: 'Childhood' },
  { name: 'Namakarana', meaning: 'Naming ceremony', stage: 'Childhood' },
  { name: 'Nishkramana', meaning: 'First outing', stage: 'Childhood' },
  { name: 'Annaprashana', meaning: 'First solid food', stage: 'Childhood' },
  { name: 'Chudakarana', meaning: 'First haircut', stage: 'Childhood' },
  { name: 'Karnavedha', meaning: 'Ear piercing', stage: 'Childhood' },
  { name: 'Vidyarambha', meaning: 'Start of education', stage: 'Education' },
  { name: 'Upanayana', meaning: 'Sacred thread ceremony', stage: 'Education' },
  { name: 'Vedarambha', meaning: 'Start of Vedic study', stage: 'Education' },
  { name: 'Keshanta', meaning: 'First shave (boys)', stage: 'Education' },
  { name: 'Samavartana', meaning: 'Graduation', stage: 'Education' },
  { name: 'Vivaha', meaning: 'Marriage', stage: 'Adulthood' },
  { name: 'Antyeshti', meaning: 'Last rites', stage: 'Death' },
];

// === AUTO-DERIVATION FUNCTIONS ===

/** Derive Raasi from Nakshatram + Pada */
export function deriveRaasi(nakshatram, pada) {
  if (!nakshatram || !pada) return '';
  const nak = NAKSHATRAM_LIST.find(n => n.name === nakshatram);
  if (!nak) return '';
  const padaIndex = parseInt(pada) - 1;
  if (padaIndex < 0 || padaIndex > 3) return '';
  return nak.raasiByPada[padaIndex] || '';
}

/** Get Gotram details including Pravara */
export function getGotramDetails(gotramName) {
  return GOTRAM_DATA.find(g => g.name === gotramName) || null;
}

/** Inherit Gotram from father's lineage */
export function inheritGotram(members, memberId) {
  const member = members.find(m => m.id === memberId);
  if (!member) return '';
  if (member.gotram) return member.gotram;
  if (member.fatherId) {
    return inheritGotram(members, member.fatherId);
  }
  return '';
}

/** Calculate age from DOB */
export function calculateAge(dob, referenceDate = new Date()) {
  if (!dob) return null;
  const birth = new Date(dob);
  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** Get upcoming birthdays in next N days */
export function getUpcomingBirthdays(members, days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = [];

  members.forEach(member => {
    if (!member.dob || member.isDeceased) return;
    const birth = new Date(member.dob);
    const thisYearBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (thisYearBday < today) {
      thisYearBday.setFullYear(today.getFullYear() + 1);
    }
    const diffDays = Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= days) {
      upcoming.push({ member, date: thisYearBday, daysUntil: diffDays, turnsAge: calculateAge(member.dob, thisYearBday) });
    }
  });

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Get upcoming anniversaries in next N days */
export function getUpcomingAnniversaries(members, days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = [];

  members.forEach(member => {
    if (!member.marriageDate || !member.spouseId) return;
    const spouse = members.find(m => m.id === member.spouseId);
    if (!spouse) return;
    // Avoid duplicates — only process the one with smaller ID
    if (member.id > member.spouseId) return;

    const wedding = new Date(member.marriageDate);
    const thisYearAnni = new Date(today.getFullYear(), wedding.getMonth(), wedding.getDate());
    if (thisYearAnni < today) {
      thisYearAnni.setFullYear(today.getFullYear() + 1);
    }
    const diffDays = Math.ceil((thisYearAnni - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= days) {
      upcoming.push({ member, spouse, date: thisYearAnni, daysUntil: diffDays, years: thisYearAnni.getFullYear() - wedding.getFullYear() });
    }
  });

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}
