import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../../');

dotenv.config({
    path: [
        path.join(BACKEND_ROOT, '.env.local'),
        path.join(BACKEND_ROOT, '.env'),
        '.env.local',
        '.env'
    ]
});

let cachedConnection = null;

export async function connectDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Reuse existing MongoDB connection in Serverless environments (e.g. Vercel)
    if (cachedConnection && mongoose.connection.readyState >= 1) {
        return cachedConnection;
    }

    try {
        cachedConnection = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        });
        console.log(`[Database] MongoDB Atlas Connected`);
        return cachedConnection;
    } catch (error) {
        console.error('[Database] MongoDB Connection Error:', error.message);
        throw error;
    }
}

