import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

async function run() {
    await connectDB();
    const doctors = await mongoose.connection.collection('doctors').find({}).toArray();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = {};
    days.forEach(d => counts[d] = 0);

    doctors.forEach(doc => {
        (doc.chambers || []).forEach(c => {
            (c.visitingDays || []).forEach(day => {
                days.forEach(d => {
                    if (day.toLowerCase().includes(d.toLowerCase())) counts[d]++;
                });
            });
        });
    });
    console.log('Chamber visiting days count:', counts);
    process.exit(0);
}
run();
