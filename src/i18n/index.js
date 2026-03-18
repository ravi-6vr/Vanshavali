import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.members': 'Members',
      'nav.tree': 'Family Tree',
      'nav.relationships': 'Relationships',
      'nav.shraddha': 'Shraddha',
      'nav.gotra': 'Gotra Check',
      'nav.health': 'Health',
      'nav.analytics': 'Analytics',
      'nav.stories': 'Stories',
      'nav.map': 'Migration Map',
      'nav.duplicates': 'Duplicates',
      'nav.settings': 'Settings',
      'nav.events': 'Events',

      // Dashboard
      'dashboard.title': 'Dashboard',
      'dashboard.totalMembers': 'Total Members',
      'dashboard.living': 'Living',
      'dashboard.generations': 'Generations',
      'dashboard.gotrams': 'Gotrams',
      'dashboard.addMember': '+ Add Member',
      'dashboard.onThisDay': 'On This Day',
      'dashboard.upcomingBirthdays': 'Upcoming Birthdays',
      'dashboard.upcomingAnniversaries': 'Upcoming Anniversaries',
      'dashboard.upcomingShraddha': 'Upcoming Shraddha',
      'dashboard.gotramDistribution': 'Gotram Distribution',
      'dashboard.familyNarrative': 'Your family',
      'dashboard.unlinked': 'Unlinked Members',

      // Members
      'members.title': 'Members',
      'members.addNew': 'Add New Member',
      'members.edit': 'Edit Member',
      'members.search': 'Search members...',
      'members.noMembers': 'No family members yet',

      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.back': 'Back',
      'common.loading': 'Loading...',
      'common.search': 'Search...',
      'common.male': 'Male',
      'common.female': 'Female',
      'common.deceased': 'Deceased',
      'common.living': 'Living',
      'common.years': 'years',
      'common.today': 'Today!',
      'common.viewAll': 'View all',

      // Settings
      'settings.title': 'Settings',
      'settings.dataManagement': 'Data Management',
      'settings.exportJSON': 'Export JSON',
      'settings.importJSON': 'Import JSON',
      'settings.exportGEDCOM': 'Export GEDCOM',
      'settings.importGEDCOM': 'Import GEDCOM',
      'settings.exportCSV': 'Export CSV',
      'settings.security': 'Security',
      'settings.language': 'Language',
      'settings.print': 'Print Directory',
    },
  },
  te: {
    translation: {
      // Navigation
      'nav.dashboard': 'ముఖ్యపుట',
      'nav.members': 'సభ్యులు',
      'nav.tree': 'కుటుంబ వృక్షం',
      'nav.relationships': 'బంధుత్వాలు',
      'nav.shraddha': 'శ్రాద్ధ పంచాంగం',
      'nav.gotra': 'గోత్ర పరీక్ష',
      'nav.health': 'ఆరోగ్యం',
      'nav.analytics': 'విశ్లేషణ',
      'nav.stories': 'కథలు',
      'nav.map': 'వలస పటం',
      'nav.duplicates': 'నకిలీ తనిఖీ',
      'nav.settings': 'అమరికలు',
      'nav.events': 'సంఘటనలు',

      // Dashboard
      'dashboard.title': 'ముఖ్యపుట',
      'dashboard.totalMembers': 'మొత్తం సభ్యులు',
      'dashboard.living': 'జీవించి ఉన్నవారు',
      'dashboard.generations': 'తరాలు',
      'dashboard.gotrams': 'గోత్రాలు',
      'dashboard.addMember': '+ సభ్యుని జోడించు',
      'dashboard.onThisDay': 'ఈ రోజు',
      'dashboard.upcomingBirthdays': 'రాబోయే పుట్టినరోజులు',
      'dashboard.upcomingAnniversaries': 'రాబోయే వివాహ వార్షికోత్సవాలు',
      'dashboard.upcomingShraddha': 'రాబోయే శ్రాద్ధం',
      'dashboard.gotramDistribution': 'గోత్ర పంపిణీ',
      'dashboard.familyNarrative': 'మీ కుటుంబం',
      'dashboard.unlinked': 'అనుసంధానం లేని సభ్యులు',

      // Members
      'members.title': 'సభ్యులు',
      'members.addNew': 'కొత్త సభ్యుని జోడించు',
      'members.edit': 'సభ్యుని సవరించు',
      'members.search': 'సభ్యులను వెతకండి...',
      'members.noMembers': 'ఇంకా కుటుంబ సభ్యులు లేరు',

      // Common
      'common.save': 'భద్రపరచు',
      'common.cancel': 'రద్దు',
      'common.delete': 'తొలగించు',
      'common.edit': 'సవరించు',
      'common.back': 'వెనుకకు',
      'common.loading': 'లోడ్ అవుతోంది...',
      'common.search': 'వెతకండి...',
      'common.male': 'పురుషుడు',
      'common.female': 'స్త్రీ',
      'common.deceased': 'మరణించినవారు',
      'common.living': 'జీవించి ఉన్నవారు',
      'common.years': 'సంవత్సరాలు',
      'common.today': 'ఈ రోజు!',
      'common.viewAll': 'అన్నీ చూడండి',

      // Settings
      'settings.title': 'అమరికలు',
      'settings.dataManagement': 'డేటా నిర్వహణ',
      'settings.exportJSON': 'JSON ఎగుమతి',
      'settings.importJSON': 'JSON దిగుమతి',
      'settings.exportGEDCOM': 'GEDCOM ఎగుమతి',
      'settings.importGEDCOM': 'GEDCOM దిగుమతి',
      'settings.exportCSV': 'CSV ఎగుమతి',
      'settings.security': 'భద్రత',
      'settings.language': 'భాష',
      'settings.print': 'డైరెక్టరీ ముద్రించు',
    },
  },
  hi: {
    translation: {
      // Navigation
      'nav.dashboard': 'मुख्य पृष्ठ',
      'nav.members': 'सदस्य',
      'nav.tree': 'पारिवारिक वृक्ष',
      'nav.relationships': 'रिश्ते',
      'nav.shraddha': 'श्राद्ध पंचांग',
      'nav.gotra': 'गोत्र जांच',
      'nav.health': 'स्वास्थ्य',
      'nav.analytics': 'विश्लेषण',
      'nav.stories': 'कहानियां',
      'nav.map': 'प्रवास मानचित्र',
      'nav.duplicates': 'डुप्लीकेट जांच',
      'nav.settings': 'सेटिंग्स',
      'nav.events': 'कार्यक्रम',

      // Dashboard
      'dashboard.title': 'मुख्य पृष्ठ',
      'dashboard.totalMembers': 'कुल सदस्य',
      'dashboard.living': 'जीवित',
      'dashboard.generations': 'पीढ़ियां',
      'dashboard.gotrams': 'गोत्र',
      'dashboard.addMember': '+ सदस्य जोड़ें',
      'dashboard.onThisDay': 'आज के दिन',
      'dashboard.upcomingBirthdays': 'आगामी जन्मदिन',
      'dashboard.upcomingAnniversaries': 'आगामी वर्षगांठ',
      'dashboard.upcomingShraddha': 'आगामी श्राद्ध',
      'dashboard.gotramDistribution': 'गोत्र वितरण',
      'dashboard.familyNarrative': 'आपका परिवार',
      'dashboard.unlinked': 'असंबद्ध सदस्य',

      // Members
      'members.title': 'सदस्य',
      'members.addNew': 'नया सदस्य जोड़ें',
      'members.edit': 'सदस्य संपादित करें',
      'members.search': 'सदस्य खोजें...',
      'members.noMembers': 'अभी तक कोई सदस्य नहीं',

      // Common
      'common.save': 'सहेजें',
      'common.cancel': 'रद्द करें',
      'common.delete': 'हटाएं',
      'common.edit': 'संपादित करें',
      'common.back': 'वापस',
      'common.loading': 'लोड हो रहा है...',
      'common.search': 'खोजें...',
      'common.male': 'पुरुष',
      'common.female': 'महिला',
      'common.deceased': 'स्वर्गवासी',
      'common.living': 'जीवित',
      'common.years': 'वर्ष',
      'common.today': 'आज!',
      'common.viewAll': 'सभी देखें',

      // Settings
      'settings.title': 'सेटिंग्स',
      'settings.dataManagement': 'डेटा प्रबंधन',
      'settings.exportJSON': 'JSON निर्यात',
      'settings.importJSON': 'JSON आयात',
      'settings.exportGEDCOM': 'GEDCOM निर्यात',
      'settings.importGEDCOM': 'GEDCOM आयात',
      'settings.exportCSV': 'CSV निर्यात',
      'settings.security': 'सुरक्षा',
      'settings.language': 'भाषा',
      'settings.print': 'डायरेक्टरी प्रिंट करें',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('vanshavali-lang') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
