import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import Doctor from '../src/models/Doctor.js';
import User from '../src/models/User.js';
import Appointment from '../src/models/Appointment.js';
import Review from '../src/models/Review.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB Atlas');

// ==========================================
// 1. Requirement 3: Remove dr_naseemtofail_14212
// ==========================================
const targetUsername = 'dr_naseemtofail_14212';
const targetDoc = await Doctor.findOne({ username: targetUsername });
if (targetDoc) {
    console.log(`Found doctor ${targetDoc.name} (@${targetUsername}). Deleting...`);
    await Doctor.deleteOne({ _id: targetDoc._id });
    if (targetDoc.userId) {
        await User.deleteOne({ _id: targetDoc.userId });
    }
    await Appointment.deleteMany({ doctorId: targetDoc._id });
    await Review.deleteMany({ doctorId: targetDoc._id });
    console.log(`Successfully removed doctor ${targetDoc.name} (@${targetUsername}) and associated records.`);
} else {
    console.log(`Doctor @${targetUsername} already removed or not found.`);
}

// ==========================================
// 2. Degree & Detail Cleaning Utilities
// ==========================================
const degreeBlacklist = [
    'shanghai', 'china', 'india', 'bogra', 'huashan hospital', 'coimbatore', 'kolkata',
    'gestational diabetes', 'and breast problems', 'breast problems', 'department',
    'hospital', 'bangladesh', 'dhaka', 'college', 'medical college', 'university',
    'training', 'course', 'advanced level', 'principles course', 'experienced in',
    'specialized in', 'specialist in', 'renowned', 'years of experience'
];

function cleanDegreeString(deg) {
    if (!deg) return '';
    // Strip emojis
    let clean = deg.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ').trim();
    
    // Convert common Bengali degrees
    clean = clean.replace(/এমবিবিএস\s*\([^)]*\)/gi, 'MBBS')
                 .replace(/এমবিবিএস/gi, 'MBBS')
                 .replace(/এমডি\s*\([^)]*\)/gi, 'MD')
                 .replace(/এমডি/gi, 'MD')
                 .replace(/ফেলোশিপ\s+ইন\s+ডার্মাটোসার্জারী/gi, 'Fellowship in Dermatosurgery')
                 .replace(/এফসিপিএস/gi, 'FCPS')
                 .replace(/এমএস/gi, 'MS');

    // Remove noisy text phrases
    clean = clean.replace(/\b(Academic Fellow|Professor and Head|Senior Consultant|Registrar|Specialist in|Trained in|Fellowship Training)\b.*$/i, '');
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean;
}

function parseAndFilterDegrees(rawDegrees) {
    if (!Array.isArray(rawDegrees)) rawDegrees = [rawDegrees].filter(Boolean);
    const results = [];

    rawDegrees.forEach(raw => {
        if (!raw || typeof raw !== 'string') return;
        const cleaned = cleanDegreeString(raw);
        if (!cleaned) return;

        // Split by commas or semicolons
        const parts = cleaned.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
        parts.forEach(part => {
            const lower = part.toLowerCase();
            // Check if it's blacklisted
            const isBlacklisted = degreeBlacklist.some(b => lower === b || (lower.startsWith(b) && lower.length < 25));
            if (isBlacklisted) return;

            // Must look like a recognized degree or qualification
            if (/\b(MBBS|FCPS|MS|MD|MRCP|MRCS|FRCS|FRCP|FACS|FICS|MCPS|DGO|DLO|DCH|BDS|MDS|MPH|PhD|D-Card|Diploma|Fellow|Fellowship)\b/i.test(part)) {
                // Trim trailing junk
                let item = part.replace(/^[-–—•\s]+/, '').replace(/[-–—•\s]+$/, '');
                if (item.length >= 2 && item.length <= 50 && !results.includes(item)) {
                    results.push(item);
                }
            }
        });
    });

    if (results.length === 0) results.push('MBBS');
    return results;
}

// ==========================================
// 3. Category Classifier (19 Disciplines)
// ==========================================
function classifySpecialty(doc) {
    const primary = (doc.specialty || '').toLowerCase();
    const secondary = [doc.designation || '', ...(doc.degrees || [])].join(' ').toLowerCase();
    const fallback = (doc.about || '').toLowerCase();

    function match(text) {
        if (/\b(dent\w*|dental|dentist|oral|maxillofacial|teeth|orthodont\w*|bds|mds)\b/i.test(text)) return 'Dentistry & Maxillofacial';
        if (/\b(plastic|burn\b|aesthetic|cosmetic|reconstructive|hair transplant)\b/i.test(text)) return 'Plastic & Aesthetic Surgery';
        if (/\b(neuro\w*|brain|spine|stroke|microsurgery)\b/i.test(text)) return 'Neurology & Neurosurgery';
        if (/\b(cardio\w*|cardiac|heart|coronary)\b/i.test(text)) return 'Cardiology';
        if (/\b(child\w*|pediatric\w*|paediatric\w*|neonat\w*|infant|newborn|adolescent|nicu|picu)\b/i.test(text)) return 'Pediatrics & Child Care';
        if (/\b(ortho\w*|bone|joint|fracture|arthroscopy|arthroplasty|trauma)\b/i.test(text)) return 'Orthopedics & Trauma';
        if (/\b(gynae\w*|gynecol\w*|obstetric\w*|obs\b|maternity|infertility|pregnancy|subfertility|fertility)\b/i.test(text)) return 'Gynecology & Obstetrics';
        if (/\b(derma\w*|skin|hair|nail|allergy|leprosy|aesthetic dermatologist|চর্ম)\b/i.test(text)) return 'Dermatology';
        if (/\b(eye|ophthalmol\w*|phaco|retina|glaucoma|vision|oculoplastic)\b/i.test(text)) return 'Ophthalmology (Eye)';
        if (/\b(ent\b|otolaryngol\w*|ear|nose|throat|dlo|head and neck|head neck)\b/i.test(text)) return 'ENT (Ear, Nose & Throat)';
        if (/\b(urol\w*|androl\w*|prostate|bladder)\b/i.test(text)) return 'Urology & Andrology';
        if (/\b(kidney|nephro\w*|dialysis|renal)\b/i.test(text)) return 'Nephrology & Kidney';
        if (/\b(gastro\w*|hepatol\w*|liver|digestive|pancrea\w*|endoscopy|colonoscopy)\b/i.test(text)) return 'Gastroenterology & Liver';
        if (/\b(colorectal|piles|fistula|fissure|laparoscopic|hernia|anorectal|gallbladder stone|breast surgery)\b/i.test(text)) return 'General & Colorectal Surgery';
        if (/\b(psychiat\w*|mental health|counseling|neuropsychiatry)\b/i.test(text)) return 'Psychiatry & Mental Health';
        if (/\b(oncol\w*|cancer|tumor|radiotherapy|radiation)\b/i.test(text)) return 'Oncology & Cancer Care';
        if (/\b(endocrine|endocrinol\w*|thyroid|hormone|hormonal|diabetologist|diabetes)\b/i.test(text)) return 'Endocrinology & Diabetes';
        if (/\b(internal medicine|rheumatol\w*|chest disease|respiratory|pulmonol\w*)\b/i.test(text)) return 'Medicine & Diabetology';
        return null;
    }

    return match(primary) || match(secondary) || match(fallback) || 'General Physician';
}

// ==========================================
// 4. Curate All Doctors in Database
// ==========================================
const allDocs = await Doctor.find({});
console.log(`Processing and curating ${allDocs.length} doctors...`);

let updatedCount = 0;

for (const doc of allDocs) {
    const isSpecialCase = doc.username === 'dr_mdsharifulis_20052';
    
    // Standardize category
    const standardSpecialty = isSpecialCase ? 'Neurology & Neurosurgery' : classifySpecialty(doc);
    const prevSpecialty = doc.specialty;

    // Clean degrees
    let cleanDegrees;
    if (isSpecialCase) {
        cleanDegrees = ['MBBS', 'FCPS (Neurosurgery)', 'FACS (USA)', 'Fellowship in Endoscopic Spine Surgery (South Korea)'];
        doc.designation = 'Associate Professor (Neurosurgery)';
        doc.currentWorkplace = 'North East Medical College Hospital';
        doc.subSpecialties = ['Brain & Spine Microsurgery', 'Endoscopic Spine Surgery', 'Neuro-Oncology', 'Skull Base Surgery'];
    } else {
        cleanDegrees = parseAndFilterDegrees(doc.degrees);
        // Clean subspecialties if messy
        if (doc.subSpecialties && Array.isArray(doc.subSpecialties)) {
            doc.subSpecialties = doc.subSpecialties
                .map(s => String(s).replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim())
                .filter(s => s.length > 2 && s.length <= 40 && !degreeBlacklist.includes(s.toLowerCase()));
        }
        // Clean designation
        if (doc.designation) {
            doc.designation = doc.designation.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
        }
    }

    doc.specialty = standardSpecialty;
    doc.degrees = cleanDegrees;

    // Ensure clean name without duplicate Dr. Dr.
    let cName = (doc.name || '').replace(/^(dr\.?\s*)+/i, '').replace(/^(prof\.?\s*dr\.?\s*)+/i, '').trim();
    if (doc.name && doc.name.toLowerCase().includes('prof')) {
        doc.name = `Prof. Dr. ${cName}`;
    } else {
        doc.name = `Dr. ${cName}`;
    }

    await doc.save();
    updatedCount++;
}

console.log(`Successfully curated and saved ${updatedCount} doctors!`);

// Summary of new specialties in DB
const summaryDocs = await Doctor.find({}).lean();
const finalCounts = {};
summaryDocs.forEach(d => {
    finalCounts[d.specialty] = (finalCounts[d.specialty] || 0) + 1;
});
console.log('\nFinal Standardized Categories in Database:');
console.log(JSON.stringify(finalCounts, null, 2));

const shariful = await Doctor.findOne({ username: 'dr_mdsharifulis_20052' }).lean();
console.log('\nVerified Dr. Md. Shariful Islam:', {
    name: shariful?.name,
    specialty: shariful?.specialty,
    degrees: shariful?.degrees,
    designation: shariful?.designation,
    subSpecialties: shariful?.subSpecialties
});

await mongoose.disconnect();
console.log('MongoDB connection closed.');
