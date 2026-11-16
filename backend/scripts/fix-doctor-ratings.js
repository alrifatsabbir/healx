import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

async function run() {
    await connectDB();
    const doc = await mongoose.connection.collection('doctors').findOne({});
    console.log('Sample doctor rating:', doc.rating, 'totalReviews:', doc.totalReviews);
    
    // Check doctor with actual review
    const reviewedDocId = new mongoose.Types.ObjectId('6af9b17b2acebfc474d1ea2f');
    
    // Set all other doctors to rating: 0, totalReviews: 0
    const res = await mongoose.connection.collection('doctors').updateMany(
        { _id: { $ne: reviewedDocId } },
        { $set: { rating: 0, totalReviews: 0 } }
    );
    console.log('Updated unreviewed doctors to 0:', res.modifiedCount);

    // Verify reviewed doctor
    const reviewedDoc = await mongoose.connection.collection('doctors').findOne({ _id: reviewedDocId });
    console.log('Reviewed doctor:', reviewedDoc.name, 'rating:', reviewedDoc.rating, 'reviews:', reviewedDoc.totalReviews);

    process.exit(0);
}
run();
