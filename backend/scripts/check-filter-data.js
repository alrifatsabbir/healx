import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

async function run() {
    await connectDB();
    const doctors = await mongoose.connection.collection('doctors').find({}).toArray();
    console.log('Total doctors:', doctors.length);

    // Gender check
    const genders = {};
    doctors.forEach(d => {
        genders[d.gender] = (genders[d.gender] || 0) + 1;
    });
    console.log('Genders in DB:', genders);

    // Sample chambers visitingDays
    let withVisitingDays = 0;
    let withChambers = 0;
    const districts = {};
    const cities = {};

    doctors.forEach(d => {
        if (d.chambers && d.chambers.length > 0) {
            withChambers++;
            d.chambers.forEach(c => {
                if (c.visitingDays && c.visitingDays.length > 0) withVisitingDays++;
                districts[c.district] = (districts[c.district] || 0) + 1;
                cities[c.city] = (cities[c.city] || 0) + 1;
            });
        }
    });

    console.log('Doctors with chambers:', withChambers);
    console.log('Chambers with visitingDays:', withVisitingDays);
    console.log('Districts sample (top 10):', Object.entries(districts).slice(0, 10));
    console.log('Sample chamber:', doctors[0]?.chambers?.[0]);

    process.exit(0);
}
run();
