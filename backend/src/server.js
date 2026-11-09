import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedAdmin } from './seed/adminSeed.js';

dotenv.config({ path: ['.env.local', '.env'] });

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
    try {
        // Connect to MongoDB Atlas
        await connectDB();

        // Ensure Super Admin is seeded
        await seedAdmin();

        // Start Hono Node Server
        serve({
            fetch: app.fetch,
            port: PORT,
        }, (info) => {
            console.log(`===============================================`);
            console.log(` 🩺 HealX Backend Server running on port ${info.port}`);
            console.log(` 🔗 API Base URL:      http://localhost:${info.port}/api`);
            console.log(` 👤 Patient Profile:   http://localhost:${info.port}/u/:username`);
            console.log(` 👨‍⚕️ Doctor Profile:    http://localhost:${info.port}/d/:username`);
            console.log(` 🚀 Environment:       ${process.env.NODE_ENV || 'development'}`);
            console.log(`===============================================`);
        });
    } catch (err) {
        console.error('Fatal Server Boot Error:', err);
        process.exit(1);
    }
}

bootstrap();
