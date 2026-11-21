import Doctor from '../models/Doctor.js';

// Comprehensive Medical Specialist Knowledge Base with Weighted Keyword Scoring & Direct Filter Slugs
const SPECIALTY_KNOWLEDGE = [
    {
        specialty: 'Neurology & Neurosurgery',
        categorySlug: 'Neurology & Neurosurgery',
        nameBn: 'নিউরোমেডিসিন / নিউরোলজি (স্নায়ুরোগ ও মাইগ্রেন বিশেষজ্ঞ)',
        keywords: [
            'migraine', 'migrane', 'migrain', 'migren', 'headache', 'head ache', 'cluster headache',
            'dizziness', 'dizzy', 'vertigo', 'seizure', 'convulsion', 'epilepsy', 'numbness',
            'tremor', 'nerve', 'neuropathy', 'stroke', 'paralysis', 'brain', 'memory loss',
            'matha betha', 'matha byatha', 'matha batha', 'matha ghora', 'mathaghora', 'matha betha kortese',
            'migrane er betha', 'migraine er betha', 'migraine betha', 'obosh', 'jhin jhin',
            'মাইগ্রেন', 'মাইগ্রেনের', 'মাইগ্রেনের ব্যথা', 'মাথাব্যথা', 'মাথা ব্যথা', 'মাথা ব্যাথা', 'মাথা ঘুরছে',
            'মাথা ঘোরা', 'মাথাঘোরা', 'খিঁচুনি', 'অসাড়তা', 'স্ট্রোক', 'স্নায়ু', 'ব্রেন', 'মস্তিষ্ক'
        ],
        weights: {
            'migraine': 12, 'migrane': 12, 'migrain': 12, 'migren': 12, 'মাইগ্রেন': 12, 'মাইগ্রেনের': 12,
            'seizure': 10, 'epilepsy': 10, 'stroke': 10, 'খিঁচুনি': 10, 'স্ট্রোক': 10,
            'headache': 6, 'মাথাব্যথা': 6, 'মাথা ব্যথা': 6, 'matha betha': 6, 'matha ghora': 6,
        },
        adviceEn: 'Rest in a quiet, dark room, avoid screen exposure, hydrate with water, and avoid known trigger foods.',
        adviceBn: 'শান্ত ও অন্ধকার ঘরে বিশ্রাম নিন, মোবাইল বা স্ক্রিনের আলো পরিহার করুন, পর্যাপ্ত পানি পান করুন এবং উজ্জ্বল আলো এড়িয়ে চলুন।'
    },
    {
        specialty: 'Cardiology',
        categorySlug: 'Cardiology',
        nameBn: 'কার্ডিওলজিস্ট (হৃদরোগ বিশেষজ্ঞ)',
        keywords: [
            'chest pain', 'heart', 'hart', 'palpitation', 'high bp', 'blood pressure', 'hypertension',
            'shortness of breath on exertion', 'buke betha', 'buk betha', 'heart attack', 'buke chap',
            'হৃদরোগ', 'বুকে ব্যথা', 'বুক ব্যথা', 'বুকব্যথা', 'বুকে চাপ', 'বুক ধড়ফড়', 'উচ্চ রক্তচাপ', 'হার্ট'
        ],
        weights: {
            'chest pain': 12, 'heart attack': 12, 'হার্ট অ্যাটাক': 12, 'বুকে ব্যথা': 10, 'বুক ব্যথা': 10,
            'buke betha': 10, 'buke chap': 10, 'বুকে চাপ': 10, 'heart': 8, 'হার্ট': 8
        },
        adviceEn: 'Chest pain or heart discomfort should never be ignored. Avoid strenuous activity and caffeine.',
        adviceBn: 'বুকে ব্যথা বা অস্বস্তিকে অবহেলা করবেন না। ভারী কাজ ও অতিরিক্ত ক্যাফেইন পরিহার করুন।',
        emergency: true,
    },
    {
        specialty: 'Orthopedics & Trauma',
        categorySlug: 'Orthopedics & Trauma',
        nameBn: 'অর্থোপেডিকস (হাড়, জোড় ও বাতব্যথা বিশেষজ্ঞ)',
        keywords: [
            'bone', 'joint', 'fracture', 'back pain', 'knee pain', 'arthritis', 'shoulder pain',
            'sprain', 'komor betha', 'komore betha', 'haatu betha', 'haat betha', 'pa betha',
            'হাড়', 'কোমর ব্যথা', 'কোমরে ব্যথা', 'কোমরব্যথা', 'হাঁটু ব্যথা', 'বাত', 'ভাঙা', 'পায়ের ব্যথা', 'জয়েন্ট ব্যথা'
        ],
        weights: {
            'back pain': 8, 'knee pain': 8, 'komor betha': 8, 'কোমর ব্যথা': 8, 'কোমরে ব্যথা': 8,
            'arthritis': 8, 'fracture': 10, 'হাঁটু ব্যথা': 8
        },
        adviceEn: 'Apply ice or a warm compress, avoid heavy lifting, and rest the affected joint.',
        adviceBn: 'ব্যথার স্থানে হালকা বরফ বা গরম সেঁক দিন, ভারী বস্তু তোলা বন্ধ রাখুন এবং বিশ্রাম নিন।'
    },
    {
        specialty: 'Pediatrics & Child Care',
        categorySlug: 'Pediatrics & Child Care',
        nameBn: 'শিশু বিশেষজ্ঞ (পেডিয়াট্রিশিয়ান)',
        keywords: [
            'baby', 'child', 'infant', 'toddler', 'shishu', 'shishur', 'bachha', 'baccha', 'baccar', 'bacca', 'bachar', 'bacchar', 'bachhar', 'baccader',
            'baby fever', 'child fever', 'child vomit',
            'বাচ্চা', 'বাচ্চার', 'বাচ্চাদের', 'শিশু', 'শিশুর', 'সন্তান', 'বাচ্চার জ্বর', 'বাচ্চা অসুস্থ', 'নবজাতক'
        ],
        weights: {
            'baby': 12, 'child': 12, 'shishu': 12, 'shishur': 12, 'bachha': 12, 'baccha': 12, 'baccar': 12, 'bacca': 12, 'bacchar': 12,
            'বাচ্চা': 12, 'বাচ্চার': 12, 'শিশু': 12, 'শিশুর': 12
        },
        adviceEn: 'Keep the child hydrated, sponge with lukewarm water for fever, and monitor feeding and activity.',
        adviceBn: 'শিশুকে স্বাভাবিক পানি ও তরল খাবার দিন, হালকা গরম পানি দিয়ে শরীর মুছে দিন এবং সতর্কতা বজায় রাখুন।'
    },
    {
        specialty: 'Gynecology & Obstetrics',
        categorySlug: 'Gynecology & Obstetrics',
        nameBn: 'গাইনী ও প্রসূতিরোগ বিশেষজ্ঞ',
        keywords: [
            'pregnancy', 'pregnant', 'period', 'menstrual', 'pelvic pain', 'ovary', 'pcos',
            'garbhabastha', 'mashik', 'maashik',
            'গর্ভবতী', 'গর্ভাবস্থা', 'মাসিক', 'পিরিয়ড', 'তলপেটে ব্যথা', 'তলপেট ব্যথা', 'গাইনী', 'গাইনোকোলজিস্ট'
        ],
        weights: {
            'pregnancy': 10, 'pregnant': 10, 'period': 8, 'menstrual': 8, 'mashik': 8, 'মাসিক': 8, 'গর্ভবতী': 10, 'গাইনী': 9
        },
        adviceEn: 'Ensure adequate hydration, rest, and keep track of your symptoms and cycle dates.',
        adviceBn: 'পর্যাপ্ত পানি পান করুন, বিশ্রাম নিন এবং লক্ষণ ও তারিখ লিখে রাখুন।'
    },
    {
        specialty: 'Dermatology',
        categorySlug: 'Dermatology',
        nameBn: 'চর্ম ও যৌনরোগ বিশেষজ্ঞ (ডার্মাটোলজিস্ট)',
        keywords: [
            'skin', 'rash', 'acne', 'itching', 'allergy', 'eczema', 'hair loss', 'chulkani', 'khujli',
            'ত্বক', 'চুলকানি', 'র‍্যাশ', 'ব্রণ', 'চর্মরোগ', 'চুল পড়া', 'অ্যালার্জি'
        ],
        weights: {
            'skin': 8, 'rash': 8, 'acne': 8, 'eczema': 9, 'chulkani': 8, 'চুলকানি': 8, 'ব্রণ': 8, 'চর্মরোগ': 9
        },
        adviceEn: 'Avoid scratching, keep the area clean and moisturized, and do not use harsh soaps.',
        adviceBn: 'নখ দিয়ে চুলকাবেন না, ত্বক পরিষ্কার ও আর্দ্র রাখুন এবং ক্ষারযুক্ত সাবান এড়িয়ে চলুন।'
    },
    {
        specialty: 'Gastroenterology & Liver',
        categorySlug: 'Gastroenterology & Liver',
        nameBn: 'গ্যাস্ট্রোএন্টারোলজিস্ট (পরিপাকতন্ত্র ও লিভার বিশেষজ্ঞ)',
        keywords: [
            'stomach pain', 'acidity', 'gas', 'gastric', 'ulcer', 'diarrhea', 'vomiting', 'constipation',
            'pet betha', 'pete betha', 'bomi', 'gas problem',
            'পেট ব্যথা', 'পেটে ব্যথা', 'পেটব্যথা', 'গ্যাস', 'গ্যাস্ট্রিক', 'এসিডিটি', 'বমি', 'ডায়রিয়া', 'কোষ্ঠকাঠিন্য', 'বদহজম'
        ],
        weights: {
            'stomach pain': 8, 'pet betha': 8, 'pete betha': 8, 'পেট ব্যথা': 8, 'পেটে ব্যথা': 8,
            'acidity': 7, 'gastric': 7, 'ulcer': 9, 'diarrhea': 8, 'ডায়রিয়া': 8
        },
        adviceEn: 'Eat light, non-spicy meals, drink plenty of oral rehydration solution (ORS) if dehydrated, and avoid oily foods.',
        adviceBn: 'হালকা ও সহজপাচ্য খাবার খান, প্রয়োজনে খাবার স্যালাইন পান করুন এবং তেল-মশলাযুক্ত খাবার বর্জন করুন।'
    },
    {
        specialty: 'ENT (Ear, Nose & Throat)',
        categorySlug: 'ENT (Ear, Nose & Throat)',
        nameBn: 'নাক, কান ও গলা বিশেষজ্ঞ (ইএনটি)',
        keywords: [
            'ear', 'throat', 'tonsil', 'hearing', 'sinus', 'runny nose', 'ear pain', 'gola betha', 'golay betha', 'kaan betha',
            'নাক', 'কান', 'গলা', 'টনসিল', 'গলা ব্যথা', 'গলায় ব্যথা', 'কান ব্যথা', 'সাইনাস'
        ],
        weights: {
            'ear': 7, 'throat': 7, 'tonsil': 8, 'sinus': 8, 'gola betha': 8, 'গলা ব্যথা': 8, 'কান ব্যথা': 8
        },
        adviceEn: 'Gargle with warm salt water, inhale steam, and stay hydrated with warm fluids.',
        adviceBn: 'হালকা গরম লবণ পানিতে কুলকুচি করুন, গরম পানির ভাপ নিন এবং কুসুম গরম পানি পান করুন।'
    },
    {
        specialty: 'Dentistry & Maxillofacial',
        categorySlug: 'Dentistry & Maxillofacial',
        nameBn: 'দাঁতের ডাক্তার (ডেন্টিস্ট)',
        keywords: [
            'tooth', 'teeth', 'dental', 'gum', 'toothache', 'daat betha', 'daate betha',
            'দাঁত', 'দাঁতের ব্যথা', 'দাঁতে ব্যথা', 'মাড়ি', 'দাঁতব্যথা', 'ডেন্টাল'
        ],
        weights: {
            'tooth': 8, 'teeth': 8, 'toothache': 9, 'dental': 8, 'daat betha': 8, 'দাঁতের ব্যথা': 9, 'দাঁত': 8
        },
        adviceEn: 'Rinse with warm salt water, avoid very hot or cold food, and maintain oral hygiene.',
        adviceBn: 'হালকা গরম লবণ পানিতে মুখ কুলকুচি করুন এবং খুব গরম বা অতিরিক্ত ঠান্ডা খাবার এড়িয়ে চলুন।'
    },
    {
        specialty: 'Psychiatry & Mental Health',
        categorySlug: 'Psychiatry & Mental Health',
        nameBn: 'মনোরোগ বিশেষজ্ঞ (সাইকিয়াট্রিস্ট)',
        keywords: [
            'depression', 'anxiety', 'panic', 'insomnia', 'sleep problem', 'mental health', 'stress', 'khum hocche na', 'chinta',
            'মানসিক', 'হতাশা', 'উদ্বেগ', 'ঘুম না হওয়া', 'টেনশন', 'সাইকিয়াট্রিস্ট'
        ],
        weights: {
            'depression': 9, 'anxiety': 9, 'panic': 9, 'insomnia': 8, 'মানসিক': 8, 'হতাশা': 9
        },
        adviceEn: 'Practice deep relaxation breathing, maintain a calm routine, and seek compassionate counseling.',
        adviceBn: 'গভীর শ্বাস-প্রশ্বাসের ব্যায়াম করুন, নিয়মিত ঘুমের অভ্যাস বজায় রাখুন এবং খোলামেলা কথা বলুন।'
    },
    {
        specialty: 'Endocrinology & Diabetes',
        categorySlug: 'Endocrinology & Diabetes',
        nameBn: 'ডায়াবেটিস, থাইরয়েড ও হরমোন বিশেষজ্ঞ (এন্ডোক্রিনোলজিস্ট)',
        keywords: [
            'diabetes', 'diabetic', 'blood sugar', 'sugar', 'thyroid', 'hormone', 'insulin',
            'ডায়াবেটিস', 'সুগার', 'রক্তে সুগার', 'থাইরয়েড', 'হরমোন', 'ইনসুলিন'
        ],
        weights: {
            'diabetes': 12, 'ডায়াবেটিস': 12, 'diabetic': 10, 'blood sugar': 10, 'সুগার': 9, 'sugar': 9, 'thyroid': 10, 'থাইরয়েড': 10
        },
        adviceEn: 'Follow a low-sugar balanced diet, check fasting and post-meal glucose levels regularly, and engage in daily brisk walking.',
        adviceBn: 'কম মিষ্টি ও কম কার্বোহাইড্রেটযুক্ত সুষম খাদ্য গ্রহণ করুন, নিয়মিত রক্তের গ্লুকোজ পরিমাপ করুন এবং প্রতিদিন নিয়মিত হাঁটাহাঁটি করুন।'
    },
    {
        specialty: 'Medicine',
        categorySlug: 'Medicine',
        nameBn: 'মেডিসিন বিশেষজ্ঞ (ইন্টারনাল মেডিসিন)',
        keywords: [
            'fever', 'cold', 'cough', 'weakness', 'fatigue', 'body pain', 'infection', 'viral fever', 'shordi', 'kash', 'jwor', 'jor',
            'durbolota', 'ga betha', 'shorir betha', 'medicine', 'general medicine',
            'জ্বর', 'ঠান্ডা', 'কাশি', 'দুর্বলতা', 'গা ব্যথা', 'শরীর ব্যথা', 'মেডিসিন', 'ভাইরাল জ্বর'
        ],
        weights: {
            'fever': 8, 'jwor': 8, 'jor': 8, 'জ্বর': 8, 'cold': 6, 'cough': 6, 'কাশি': 6, 'ঠান্ডা': 6, 'medicine': 7, 'মেডিসিন': 7
        },
        adviceEn: 'Take adequate bed rest, drink warm fluids, stay hydrated, and monitor your body temperature regularly.',
        adviceBn: 'পর্যাপ্ত বিশ্রাম নিন, কুসুম গরম পানি ও তরল খাবার গ্রহণ করুন এবং নিয়মিত শরীরের তাপমাত্রা পরিমাপ করুন।'
    },
];

// Helper to check if text contains Bengali characters or Banglish patterns
function isBengaliText(text = '') {
    return /[\u0980-\u09FF]/.test(text) || /\b(amar|amr|apnar|apni|tumi|tomar|korteche|kortese|korche|betha|byatha|batha|daktar|dekhte|dekhabo|shomossha|somossha|khuje|koto|ki|kivabe|keno|hoise|hocche|ache|achhe|shuru|matha|buke|pete|haat|paa|gola|baccar|baccha|shishu|keu|ase|asey|pase|pasey)\b/i.test(text);
}

// Major Bangladesh cities, divisions and prominent Dhaka neighborhoods
const BANGLADESH_AREAS = [
    'mirpur', 'dhanmondi', 'uttara', 'gulshan', 'banani', 'mohammadpur', 'motijheel',
    'badda', 'rampura', 'khilgaon', 'malibagh', 'shantinagar', 'jatrabari', 'old dhaka',
    'puran dhaka', 'bashundhara', 'baridhara', 'mohakhali', 'tejgaon', 'farmgate',
    'shyamoli', 'kalyanpur', 'savar', 'keraniganj', 'gazipur', 'narayanganj',
    'dhaka', 'chittagong', 'chattogram', 'sylhet', 'rajshahi', 'khulna', 'barisal',
    'barishal', 'rangpur', 'mymensingh', 'comilla', 'cumilla', 'bogura', 'bogra',
    'coxs bazar', 'cox\'s bazar', 'feni', 'noakhali', 'jashore', 'jessore', 'kushtia',
    'pabna', 'dinajpur', 'tangail', 'faridpur', 'jamalpur', 'brahmanbaria'
];

function extractLocation(text = '') {
    const textLower = text.toLowerCase();
    for (const area of BANGLADESH_AREAS) {
        const regex = new RegExp(`(^|[^a-z0-9])${area}(e|er|te|ye)?([^a-z0-9]|$)`, 'i');
        if (regex.test(textLower)) {
            return area.charAt(0).toUpperCase() + area.slice(1);
        }
    }
    if (/মিরপুর|মিরপুরে/i.test(text)) return 'Mirpur';
    if (/ধানমন্ডি|ধানমন্ডিতে/i.test(text)) return 'Dhanmondi';
    if (/উত্তরা|উত্তরায়/i.test(text)) return 'Uttara';
    if (/গুলশান|গুলশানে/i.test(text)) return 'Gulshan';
    if (/বনানী|বনানীতে/i.test(text)) return 'Banani';
    if (/মোহাম্মদপুর|মোহাম্মদপুরে/i.test(text)) return 'Mohammadpur';
    if (/শ্যামলী|শ্যামলীতে/i.test(text)) return 'Shyamoli';
    if (/বসুন্ধরা|বসুন্ধরায়/i.test(text)) return 'Bashundhara';
    if (/ঢাকা|ঢাকায়/i.test(text)) return 'Dhaka';
    if (/চট্টগ্রাম|চট্টগ্রামে/i.test(text)) return 'Chittagong';
    if (/সিলেট|সিলেটে/i.test(text)) return 'Sylhet';
    if (/রাজশাহী|রাজশাহীতে/i.test(text)) return 'Rajshahi';
    if (/খুলনা|খুলনায়/i.test(text)) return 'Khulna';
    if (/বরিশাল|বরিশালে/i.test(text)) return 'Barishal';
    if (/রংপুর|রংপুরে/i.test(text)) return 'Rangpur';
    if (/ময়মনসিংহ|ময়মনসিংহে/i.test(text)) return 'Mymensingh';
    if (/কুমিল্লা|কুমিল্লায়/i.test(text)) return 'Comilla';
    if (/বগুড়া|বগুড়ায়/i.test(text)) return 'Bogura';
    return null;
}

function findPreviousSpecialty(history = []) {
    if (!Array.isArray(history) || history.length === 0) return null;

    for (let i = history.length - 1; i >= 0; i--) {
        const item = history[i];
        if (item.suggestedSpecialty) {
            const found = SPECIALTY_KNOWLEDGE.find(s => s.specialty === item.suggestedSpecialty);
            if (found) return found;
        }
        if (item.text) {
            const textLower = item.text.toLowerCase();
            let prevBest = null;
            let prevScore = 0;
            for (const s of SPECIALTY_KNOWLEDGE) {
                for (const kw of s.keywords) {
                    const kwLower = kw.toLowerCase();
                    if (textLower.includes(kwLower)) {
                        const w = s.weights?.[kwLower] || 3;
                        if (w > prevScore) {
                            prevScore = w;
                            prevBest = s;
                        }
                    }
                }
            }
            if (prevBest && prevScore >= 6) {
                return prevBest;
            }
        }
    }
    return null;
}

// System Prompt for Google Gemini with Mandatory Direct Links & Multi-Turn Memory Requirement
const SYSTEM_INSTRUCTION = `You are "HealiiX HealthBot", a compassionate, professional AI Medical Assistant for HealiiX (a leading healthcare and verified doctor consultation platform in Bangladesh).

CRITICAL CONVERSATIONAL MEMORY & LOCATION CONTINUITY:
1. Always maintain conversational continuity from previous turns!
   - If the patient previously asked about a child (Pediatrics & Child Care), and follows up with e.g. "Mirpur er moddhe or asey pasey keu ache" or "Dhanmondi te keu ache?", KEEP discussing Pediatrics! DO NOT switch to General Medicine or another random department!
   - If the user asks for doctors in a location (such as Mirpur, Dhanmondi, Uttara, etc.), provide trusted hospitals and chambers in that area for the ACTIVE specialty, and link directly using:
     [মিরপুরে শিশু বিশেষজ্ঞ ডাক্তারদের তালিকা দেখুন](find-doctors.html?category=Pediatrics%20%26%20Child%20Care&q=Mirpur)

CRITICAL DIRECT LINKING REQUIREMENT:
Whenever you analyze symptoms and recommend a medical specialty, you MUST ALWAYS provide a direct markdown link to the HealiiX Doctor Directory with the exact specialty category filter (and query if location is mentioned) so the patient can click and instantly see matching doctors!

Direct Filter Links format:
• find-doctors.html?category=<SpecialtyName> (and optionally &q=<LocationName>)
• Examples:
  - Pediatrics: [Find Pediatricians on HealiiX](find-doctors.html?category=Pediatrics%20%26%20Child%20Care)
  - Pediatrics in Mirpur: [মিরপুরে শিশু বিশেষজ্ঞ ডাক্তারদের তালিকা দেখুন](find-doctors.html?category=Pediatrics%20%26%20Child%20Care&q=Mirpur)
  - Neurology & Migraine: [Find Neurology Specialists on HealiiX](find-doctors.html?category=Neurology%20%26%20Neurosurgery)
  - Cardiology & Heart: [Find Cardiology Specialists on HealiiX](find-doctors.html?category=Cardiology)
  - Orthopedics: [Find Orthopedic Specialists on HealiiX](find-doctors.html?category=Orthopedics%20%26%20Trauma)
  - Gynecology: [Find Gynecologists on HealiiX](find-doctors.html?category=Gynecology%20%26%20Obstetrics)
  - Dermatology: [Find Dermatologists on HealiiX](find-doctors.html?category=Dermatology)
  - Gastroenterology: [Find Gastroenterologists on HealiiX](find-doctors.html?category=Gastroenterology%20%26%20Liver)
  - ENT: [Find ENT Specialists on HealiiX](find-doctors.html?category=ENT%20(Ear,%20Nose%20%26%20Throat))
  - Dentistry: [Find Dentists on HealiiX](find-doctors.html?category=Dentistry%20%26%20Maxillofacial)
  - Endocrinology & Diabetes: [Find Diabetes & Hormone Specialists on HealiiX](find-doctors.html?category=Endocrinology%20%26%20Diabetes)
  - Medicine: [Find Medicine Specialists on HealiiX](find-doctors.html?category=Medicine)

Core Objectives:
1. Primary Symptom Triage & Guidance:
   - Carefully identify what the patient is suffering from (e.g. Migraine belongs to Neurology, Child care belongs to Pediatrics, not General Medicine!).
   - Explain possible causes reassuringly.
   - Do NOT give prescription drug dosages; provide safe, practical non-medicinal comfort and first-aid recommendations.
2. Specialist Recommendations & 1-Click Link:
   - Clearly state the recommended specialist and area if specified.
   - Insert the direct filter link formatted above prominently.
3. Language Fluency:
   - If the patient communicates in Bengali (বাংলা) or Banglish (e.g. "amar baccar jonno...", "Mirpur er moddhe..."), reply in warm, natural Bengali or Banglish.
   - If in English, reply in polished, empathetic English.
4. Red Flags & Emergencies:
   - If symptoms indicate an acute emergency (severe chest pain, high fever with convulsion, breathlessness, heavy bleeding, loss of consciousness), advise calling 999 or going immediately to the nearest hospital ER.
5. Conclude with a gentle medical disclaimer.`;

/**
 * Context-Aware Weighted Clinical Triage Engine
 */
function runClinicalTriage(userMessage = '', history = []) {
    const textLower = userMessage.toLowerCase().trim();
    const isBn = isBengaliText(userMessage);
    const location = extractLocation(userMessage);

    // Emergency red-flag detection
    const isEmergency = /chest pain|heart attack|stroke|paralysis|can't breathe|loss of consciousness|severe bleeding|বুক ব্যথা|হার্ট অ্যাটাক|শ্বাসকষ্ট|অজ্ঞান/i.test(textLower);

    // Match specialty with weighted scoring
    let bestMatched = null;
    let highestScore = 0;

    for (const item of SPECIALTY_KNOWLEDGE) {
        let score = 0;
        for (const kw of item.keywords) {
            const kwLower = kw.toLowerCase();
            if (textLower.includes(kwLower)) {
                const weight = item.weights?.[kwLower] || 3;
                score += weight;
            }
        }
        if (score > highestScore) {
            highestScore = score;
            bestMatched = item;
        }
    }

    // MULTI-TURN CONVERSATION MEMORY:
    // If current message has no or weak specialty keywords (e.g. follow-up query, location query like "Mirpur er moddhe keu ache?"),
    // inherit the active specialty from previous turn!
    const prevSpecialty = findPreviousSpecialty(history);
    if ((!bestMatched || highestScore < 6) && prevSpecialty) {
        bestMatched = prevSpecialty;
    }

    if (!bestMatched) {
        bestMatched = SPECIALTY_KNOWLEDGE.find(s => s.specialty === 'Medicine') || SPECIALTY_KNOWLEDGE[SPECIALTY_KNOWLEDGE.length - 1];
    }

    const categoryParam = encodeURIComponent(bestMatched.categorySlug || bestMatched.specialty);
    const filterUrl = location
        ? `find-doctors.html?category=${categoryParam}&q=${encodeURIComponent(location)}`
        : `find-doctors.html?category=${categoryParam}`;

    const filterLabelEn = location
        ? `Find ${bestMatched.specialty} Doctors in ${location}`
        : `Find ${bestMatched.specialty} Doctors`;
    const filterLabelBn = location
        ? `${location}-এ ${bestMatched.nameBn.split('(')[0].trim()} ডাক্তার খুঁজুন`
        : `${bestMatched.nameBn.split('(')[0].trim()} ডাক্তার খুঁজুন`;

    if (isEmergency) {
        return {
            reply: isBn
                ? `🚨 **জরুরি স্বাস্থ্য সতর্কতা:**\n\nআপনার বর্ণিত লক্ষণগুলো গুরুতর জরুরি স্বাস্থ্য ঝুঁকির ইঙ্গিত দিতে পারে। অনতিবিলম্বে নিকটস্থ হাসপাতালের ইমার্জেন্সি বিভাগে যান অথবা জাতীয় জরুরি সেবা **৯৯৯ (999)** এ কল করুন। কোনো প্রকার বিলম্ব করবেন না।\n\n👉 **[নিকটস্থ কার্ডিওলজিস্ট ও জরুরি সেবা খুঁজুন](${filterUrl})**\n\n*সতর্কতা: এটি একটি এআই সহকারী, জরুরি অবস্থায় বিলম্ব না করে সরাসরি হাসপাতালে যোগাযোগ করুন।*`
                : `🚨 **URGENT MEDICAL WARNING:**\n\nThe symptoms you described may indicate a medical emergency. Please visit the nearest hospital emergency room immediately or dial **999** for emergency ambulance services in Bangladesh. Do not delay.\n\n👉 **[Find Emergency Cardiology Specialists on HealiiX](${filterUrl})**\n\n*Note: This is an automated triage alert. Please seek immediate in-person emergency care.*`,
            suggestedSpecialty: bestMatched.specialty,
            categorySlug: bestMatched.categorySlug,
            location,
            filterUrl,
            filterLabel: filterLabelEn,
            filterLabelBn,
            isEmergency: true,
            highestScore,
        };
    }

    // Contextual response when user asks for a specific location / neighborhood
    if (location) {
        return {
            reply: isBn
                ? `📍 **${location} ও আশেপাশের বিশেষজ্ঞ তথ্য:**\n\n` +
                  `আপনার কাঙ্ক্ষিত এলাকায় **${bestMatched.nameBn}** বিশেষজ্ঞ ডাক্তারদের চেম্বার ও ক্লিনিক্যাল তথ্য নিচে যুক্ত করা হলো। আপনি সরাসরি তাঁদের চেম্বারের সময়সূচী দেখতে পারেন এবং অনলাইন বা অফলাইন অ্যাপয়েন্টমেন্ট বুক করতে পারেন।\n\n` +
                  `👉 **[${location}-এ ${bestMatched.nameBn.split('(')[0].trim()} ডাক্তারদের তালিকা দেখুন ও বুক করুন](${filterUrl})**\n\n` +
                  `*প্রয়োজনে অন্যান্য শীর্ষ হাসপাতালের সিনিয়র বিশেষজ্ঞদের সাথে ভিডিও কনসালটেশনের সুবিধাও রয়েছে।*`
                : `📍 **Specialists in and around ${location}:**\n\n` +
                  `Here is the verified list of **${bestMatched.specialty}** doctors available in or near ${location}. You can view visiting hours and schedule an in-person or online consultation.\n\n` +
                  `👉 **[View ${bestMatched.specialty} Specialists in ${location}](${filterUrl})**`,
            suggestedSpecialty: bestMatched.specialty,
            categorySlug: bestMatched.categorySlug,
            location,
            filterUrl,
            filterLabel: filterLabelEn,
            filterLabelBn,
            isEmergency: false,
            highestScore,
        };
    }

    if (isBn) {
        return {
            reply: `আপনার লক্ষণ অনুযায়ী আমাদের প্রাথমিক পর্যালোচনা নিচে দেওয়া হলো:\n\n` +
                   `🩺 **সুপারিশকৃত বিশেষজ্ঞ:** **${bestMatched.nameBn}**\n\n` +
                   `💡 **প্রাথমিক পরামর্শ ও যত্ন:**\n` +
                   `• ${bestMatched.adviceBn}\n` +
                   `• লক্ষণগুলো কখন শুরু হয়েছে এবং তীব্রতা কেমন তা লক্ষ্য রাখুন।\n` +
                   `• কোনো প্রকার মানসিক চাপ বা স্ক্রিনের উজ্জ্বল আলো এড়িয়ে চলুন।\n\n` +
                   `👉 **[${bestMatched.nameBn.split('(')[0].trim()} বিশেষজ্ঞ ডাক্তারদের তালিকা দেখুন ও বুক করুন](${filterUrl})**\n\n` +
                   `*সতর্কতা: এই তথ্য সাধারণ স্বাস্থ্য সচেতনতা ও দিকনির্দেশনার জন্য। এটি সরাসরি ক্লিনিক্যাল রোগ নির্ণয়ের বিকল্প নয়।*`,
            suggestedSpecialty: bestMatched.specialty,
            categorySlug: bestMatched.categorySlug,
            location: null,
            filterUrl,
            filterLabel: filterLabelEn,
            filterLabelBn,
            isEmergency: false,
            highestScore,
        };
    } else {
        return {
            reply: `Here is our preliminary triage assessment for your symptoms:\n\n` +
                   `🩺 **Recommended Specialist:** **${bestMatched.specialty}**\n\n` +
                   `💡 **Care & Comfort Guidance:**\n` +
                   `• ${bestMatched.adviceEn}\n` +
                   `• Monitor the frequency, duration, and severity of your symptoms.\n` +
                   `• If symptoms persist or worsen, consult a certified specialist promptly.\n\n` +
                   `👉 **[View & Book Verified ${bestMatched.specialty} Specialists on HealiiX](${filterUrl})**\n\n` +
                   `*Note: This response provides educational and triage direction and is not a substitute for an in-person clinical diagnosis by a registered physician.*`,
            suggestedSpecialty: bestMatched.specialty,
            categorySlug: bestMatched.categorySlug,
            location: null,
            filterUrl,
            filterLabel: filterLabelEn,
            filterLabelBn,
            isEmergency: false,
            highestScore,
        };
    }
}

/**
 * Call Google Gemini Generative API via REST
 */
async function callGeminiApi(apiKey, userMessage, history = []) {
    const models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];
    const contents = [];

    if (Array.isArray(history)) {
        for (const msg of history.slice(-8)) {
            const role = msg.sender === 'user' ? 'user' : 'model';
            if (msg.text && typeof msg.text === 'string') {
                contents.push({ role, parts: [{ text: msg.text }] });
            }
        }
    }

    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    let lastError = null;

    for (const modelName of models) {
        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            const payload = {
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                contents,
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 800,
                    topP: 0.8,
                }
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(4000)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `HTTP ${response.status} from Gemini ${modelName}`);
            }

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (textResponse) {
                return {
                    reply: textResponse.trim(),
                    model: modelName,
                    source: 'gemini'
                };
            }
        } catch (err) {
            console.warn(`[Gemini API] Failed on model ${modelName}:`, err.message);
            lastError = err;
        }
    }

    throw lastError || new Error('All Gemini models failed');
}

/**
 * Hybrid Balancing Logic:
 * Standard symptoms are answered immediately (<10ms) by the local rule-based clinical triage engine.
 * Only complex, multi-symptom, explanatory, or lab-test queries escalate to Gemini AI.
 */
function shouldEscalateToAI(userMessage = '', matchScore = 0, history = []) {
    const text = userMessage.toLowerCase().trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // 1. Weak or no keyword match (< 6) -> Ambiguous/unmatched symptoms need Generative AI
    if (matchScore < 6) return true;

    // 2. Explanatory, lab-test, medication-interaction, or causal questions
    const complexKeywords = [
        'why', 'what causes', 'how does', 'explain', 'difference between', 'side effect',
        'side effects', 'dosage', 'prescription', 'interaction', 'blood test', 'lab report',
        'ecg', 'ultrasound', 'mri', 'ct scan', 'biopsy', 'hba1c', 'complication', 'treatment',
        'home remedy', 'cure', 'recovery time', 'chronic', 'surgery',
        'কেন', 'কারণ কি', 'কি কারণে', 'পার্শ্বপ্রতিক্রিয়া', 'ওষুধের নাম', 'ওষুধ', 'ডোজ', 'টেস্ট',
        'রিপোর্ট', 'হোম রেমেডি', 'ঘরোয়া উপায়', 'ভালো করার উপায়', 'কতোদিন লাগবে', 'অপারেশন',
        'karon ki', 'keno hoy', 'kivabe bhalo', 'side effect', 'report dekhe', 'osudh'
    ];

    for (const kw of complexKeywords) {
        if (text.includes(kw)) {
            return true;
        }
    }

    // 3. Multi-sentence complex clinical narrative (> 25 words)
    if (wordCount > 25) {
        return true;
    }

    // Standard symptoms (migraine, back pain, fever, chest discomfort, doctor search, etc.):
    // handled directly by local clinical triage engine!
    return false;
}

/**
 * Main Chat Processing Handler
 */
export async function processBotMessage({ message, history = [] }) {
    if (!message || typeof message !== 'string' || !message.trim()) {
        return {
            reply: 'Hello! I am HealiiX HealthBot. Please describe what symptoms or health questions you have today.',
            suggestedDoctors: [],
            mode: 'empty',
        };
    }

    const cleanMessage = message.trim();
    const apiKey = (process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

    let botReply = '';
    let usedModel = 'rule-based-clinical-triage';
    let source = 'local-script';

    // Step 1: Detect specialty & location context via conversational triage engine
    const triageResult = runClinicalTriage(cleanMessage, history);
    let suggestedSpecialty = triageResult.suggestedSpecialty;
    let filterUrl = triageResult.filterUrl;
    let filterLabel = isBengaliText(cleanMessage) ? triageResult.filterLabelBn : triageResult.filterLabel;
    let detectedLocation = triageResult.location;

    // Step 2: Hybrid Escalation
    // Standard symptoms use the local clinical script instantly (<10ms).
    // ONLY complex, ambiguous, or explanatory queries hit Gemini AI.
    const isComplex = shouldEscalateToAI(cleanMessage, triageResult.highestScore, history);

    if (isComplex && apiKey) {
        try {
            const geminiResult = await callGeminiApi(apiKey, cleanMessage, history);
            botReply = geminiResult.reply;
            usedModel = geminiResult.model;
            source = 'gemini';

            // Extract exact specialty and location from Gemini's markdown link if present
            const linkMatch = botReply.match(/find-doctors\.html\?([^)\s"']+)/i);
            if (linkMatch) {
                filterUrl = `find-doctors.html?${linkMatch[1]}`;
                const urlParams = new URLSearchParams(linkMatch[1].replace(/&amp;/g, '&'));
                const cat = urlParams.get('category');
                const q = urlParams.get('q');
                if (cat) {
                    const matchedKnown = SPECIALTY_KNOWLEDGE.find(s => s.specialty.toLowerCase() === cat.toLowerCase() || (s.categorySlug && s.categorySlug.toLowerCase() === cat.toLowerCase()));
                    if (matchedKnown) {
                        suggestedSpecialty = matchedKnown.specialty;
                    }
                }
                if (q) {
                    detectedLocation = q;
                }
            } else {
                botReply += `\n\n👉 **[${filterLabel}](${filterUrl})**`;
            }
        } catch (apiErr) {
            console.warn('[HealiiX AI Bot] Gemini API unavailable, smoothly using smart triage:', apiErr.message);
            botReply = triageResult.reply;
            usedModel = 'rule-based-clinical-triage';
            source = 'local-script';
        }
    } else {
        // Fast instant local script response!
        botReply = triageResult.reply;
        usedModel = 'rule-based-clinical-triage';
        source = 'local-script';
    }

    // Step 3: Fetch matching doctors from database to enrich the recommendation
    let matchingDoctors = [];
    try {
        if (suggestedSpecialty) {
            const searchKeyword = suggestedSpecialty.split('&')[0].trim();
            const baseQuery = {
                specialty: { $regex: new RegExp(searchKeyword, 'i') },
                isApproved: true,
            };

            let docs = [];
            if (detectedLocation) {
                const locRegex = new RegExp(detectedLocation, 'i');
                docs = await Doctor.find({
                    ...baseQuery,
                    $or: [
                        { 'chambers.address': locRegex },
                        { 'chambers.hospitalName': locRegex },
                        { 'chambers.city': locRegex },
                        { 'chambers.district': locRegex },
                        { hospital: locRegex }
                    ]
                })
                .select('name username specialty degrees hospital rating totalReviews chambers avatar photoUrl')
                .limit(3)
                .lean();
            }

            if (docs.length === 0) {
                docs = await Doctor.find(baseQuery)
                    .select('name username specialty degrees hospital rating totalReviews chambers avatar photoUrl')
                    .limit(3)
                    .lean();
            }

            matchingDoctors = docs.map((d) => {
                const primaryChamber = (d.chambers && d.chambers.length > 0) ? d.chambers[0] : {};
                return {
                    name: d.name,
                    username: d.username,
                    specialty: d.specialty,
                    hospital: d.hospital || primaryChamber.hospitalName || 'Top Tier Specialized Medical Center',
                    fee: primaryChamber.fee ? `৳${primaryChamber.fee}` : '৳1,000',
                    location: primaryChamber.city || primaryChamber.district || 'Dhaka',
                    rating: d.rating ? d.rating.toFixed(1) : '5.0',
                    avatar: d.photoUrl || d.avatar || '',
                    profileUrl: `doctor-profile.html?d=${encodeURIComponent(d.username)}`,
                };
            });
        }
    } catch (dbErr) {
        console.warn('[HealiiX AI Bot] Could not fetch matching doctors from DB:', dbErr.message);
    }

    return {
        reply: botReply,
        suggestedSpecialty,
        filterUrl,
        filterLabel,
        matchingDoctors,
        model: usedModel,
        source,
        hasApiKey: !!apiKey,
    };
}
