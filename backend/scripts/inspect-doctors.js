import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import Doctor from '../src/models/Doctor.js';

const mongoUri = process.env.MONGODB_URI;
console.log('Connecting to:', mongoUri ? mongoUri.replace(/:[^:@]+@/, ':****@') : 'UNDEFINED');

await mongoose.connect(mongoUri);
const doctors = await Doctor.find({}).lean();
console.log('Total doctors in DB:', doctors.length);

const messyList = [];
doctors.forEach(d => {
    const degs = d.degrees || [];
    const hasLong = degs.some(deg => deg.length > 40 || deg.includes('Hospital') || deg.includes('China') || deg.includes('Training') || deg.includes('Course') || deg.includes('Department'));
    const isSpecialtyMessy = d.specialty && (d.specialty.length > 35 || d.specialty.includes('Dedicated') || d.specialty.includes('MBBS') || d.specialty.includes('Specialization') || d.specialty.includes('🧠'));
    if (hasLong || isSpecialtyMessy) {
        messyList.push({
            username: d.username,
            name: d.name,
            specialty: d.specialty,
            degrees: degs
        });
    }
});

console.log('Total messy doctors:', messyList.length);
console.log('Sample 10:');
messyList.slice(0, 10).forEach(m => {
    console.log(`- @${m.username} (${m.name}):\n  Specialty: ${m.specialty}\n  Degrees: ${JSON.stringify(m.degrees)}`);
});

await mongoose.disconnect();
