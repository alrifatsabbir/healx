import { serve } from '@hono/node-server';
import env from './config/env.js';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedAdmin } from './seed/adminSeed.js';

async function bootstrap() {
    try {
        // Connect to MongoDB Atlas
        await connectDB();

        // Ensure Super Admin is seeded
        await seedAdmin();

        // Start Hono Node Server
        serve({
            fetch: app.fetch,
            port: env.PORT,
        }, (info) => {
            console.log(`=========================================================`);
            console.log(` 🩺 HealiiX Backend Server running on port ${info.port}`);
            console.log(` 🌐 Mode:            ${env.NODE_ENV.toUpperCase()}`);
            console.log(` 🔗 Backend API:     ${env.BACKEND_URL}/api`);
            console.log(` 🖥️ Frontend App:    ${env.FRONTEND_URL}`);
            console.log(` 🤖 AI Bot Service:  ${env.AI_BOT_URL}`);
            console.log(`=========================================================`);
        });
    } catch (err) {
        console.error('Fatal Server Boot Error:', err);
        process.exit(1);
    }
}

bootstrap();
