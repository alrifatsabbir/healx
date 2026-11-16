import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

async function run() {
    await connectDB();
    const maleUsernames = ['dr_drmmhasanshi_36364', 'dr_mdakterkamal_37201', 'dr_ahmafzalulha_37023', 'dr_amritalalhal_43328'];
    for (const u of maleUsernames) {
        await mongoose.connection.collection('doctors').updateOne({ username: u }, { $set: { gender: 'Male' } });
        await mongoose.connection.collection('users').updateOne({ username: u }, { $set: { gender: 'male' } });
    }
    const femaleDocs = await mongoose.connection.collection('doctors').find({ gender: 'Female' }).toArray();
    console.log('Confirmed Female doctors (' + femaleDocs.length + '):');
    femaleDocs.forEach(d => console.log(' - ' + d.name + ' (' + d.username + ')'));
    process.exit(0);
}
run();
