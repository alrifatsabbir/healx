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

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB() {
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }

    try {
        const conn = await mongoose.connect(MONGODB_URI);
        console.log(`[Database] MongoDB Atlas Connected`);
        return conn;
    } catch (error) {
        console.error('[Database] MongoDB Connection Error:', error.message);
        throw error;
    }
}

