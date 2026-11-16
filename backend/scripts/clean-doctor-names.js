import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

async function run() {
    await connectDB();
    const doctors = await mongoose.connection.collection('doctors').find({}).toArray();
    for (const d of doctors) {
        let fixed = d.name.replace(/\(([a-z0-9]+)\)/gi, (m, p) => '(' + p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() + ')');
        fixed = fixed.replace(/\s+/g, ' ').trim();
        if (fixed !== d.name) {
            await mongoose.connection.collection('doctors').updateOne({ _id: d._id }, { $set: { name: fixed } });
            await mongoose.connection.collection('users').updateOne({ username: d.username }, { $set: { fullName: fixed } });
            console.log('Fixed:', d.name, '->', fixed);
        }
    }
    console.log('Done.');
    process.exit(0);
}
run();
