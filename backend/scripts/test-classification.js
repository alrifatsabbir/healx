import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import Doctor from '../src/models/Doctor.js';

await mongoose.connect(process.env.MONGODB_URI);
const doctors = await Doctor.find({}).lean();

export function classifyDoctor(doc) {
    const primary = (doc.specialty || '').toLowerCase();
    const secondary = [doc.designation || '', ...(doc.degrees || [])].join(' ').toLowerCase();
    const fallback = (doc.about || '').toLowerCase();

    function match(text) {
        if (/\b(dent|dental|dentist|oral|maxillofacial|teeth|orthodont|bds|mds)\b/i.test(text)) return 'Dentistry & Maxillofacial';
        if (/\b(plastic|burn|aesthetic|cosmetic|reconstructive|hair transplant)\b/i.test(text)) return 'Plastic & Aesthetic Surgery';
        if (/\b(neuro|neurosurgery|neurosurgeon|brain|spine surgery|microsurgery|neuromedicine|neurologist)\b/i.test(text)) return 'Neurology & Neurosurgery';
        if (/\b(cardio|cardiologist|cardiology|cardiac|heart|coronary)\b/i.test(text)) return 'Cardiology';
        if (/\b(child|pediatric|paediatric|neonat|infant|newborn|adolescent|nicu|picu)\b/i.test(text)) return 'Pediatrics & Child Care';
        if (/\b(ortho|orthopedic|orthopaedic|bone|joint|fracture|arthroscopy|arthroplasty|trauma)\b/i.test(text)) return 'Orthopedics & Trauma';
        if (/\b(gynae|gynecology|gynecologist|obstetrics|obs|maternity|infertility|pregnancy|subfertility)\b/i.test(text)) return 'Gynecology & Obstetrics';
        if (/\b(derma|dermatology|dermatologist|skin|hair|nail|allergy|leprosy|aesthetic dermatologist|চর্ম)\b/i.test(text)) return 'Dermatology';
        if (/\b(eye|ophthalmology|ophthalmologist|phaco|retina|glaucoma|vision|oculoplastic)\b/i.test(text)) return 'Ophthalmology (Eye)';
        if (/\b(ent|otolaryngology|ear|nose|throat|dlo|head and neck|head neck)\b/i.test(text)) return 'ENT (Ear, Nose & Throat)';
        if (/\b(urol|urology|urologist|andrology|prostate|bladder)\b/i.test(text)) return 'Urology & Andrology';
        if (/\b(kidney|nephro|nephrology|nephrologist|dialysis|renal)\b/i.test(text)) return 'Nephrology & Kidney';
        if (/\b(gastro|gastroenterology|hepatology|liver|digestive|pancrea|endoscopy|colonoscopy)\b/i.test(text)) return 'Gastroenterology & Liver';
        if (/\b(colorectal|piles|fistula|fissure|laparoscopic|hernia|anorectal|gallbladder stone|breast surgery)\b/i.test(text)) return 'General & Colorectal Surgery';
        if (/\b(psychiat|psychiatry|psychiatrist|mental health|counseling|neuropsychiatry)\b/i.test(text)) return 'Psychiatry & Mental Health';
        if (/\b(oncol|oncology|cancer|tumor|radiotherapy|radiation)\b/i.test(text)) return 'Oncology & Cancer Care';
        if (/\b(endocrine|endocrinology|thyroid|hormone|hormonal|diabetologist|diabetes)\b/i.test(text)) return 'Endocrinology & Diabetes';
        if (/\b(internal medicine|rheumatol|chest disease|respiratory|pulmonol)\b/i.test(text)) return 'Internal Medicine';
        return null;
    }

    return match(primary) || match(secondary) || match(fallback) || 'General Physician';
}

const counts = {};
doctors.forEach(d => {
    const cat = classifyDoctor(d);
    counts[cat] = (counts[cat] || 0) + 1;
});

console.log('Classified breakdown:');
console.log(JSON.stringify(counts, null, 2));

const drSaddam = doctors.find(d => d.username === 'drsaddamhussein');
console.log('\nDr. Saddam:', drSaddam?.name, '->', classifyDoctor(drSaddam));

const drShariful = doctors.find(d => d.username === 'dr_mdsharifulis_20052');
console.log('Dr. Shariful Islam:', drShariful?.name, '->', classifyDoctor(drShariful));

await mongoose.disconnect();
