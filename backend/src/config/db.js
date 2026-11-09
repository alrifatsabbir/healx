import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB() {
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }

    try {
        const conn = await mongoose.connect(MONGODB_URI);
        console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host} / ${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error('[Database] MongoDB Connection Error:', error.message);
        throw error;
    }
}

