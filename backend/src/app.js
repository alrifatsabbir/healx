import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '../../frontend');
import authRoutes from './routes/auth.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import profileRoutes from './routes/profile.routes.js';
import contactRoutes from './routes/contact.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notification.routes.js';

export const app = new Hono();

// Universal Resilient CORS Middleware (Supports local Live Server, Vercel frontend, and production origins)
app.use('*', cors({
    origin: (origin) => {
        // Echo back the request origin so credentials work seamlessly across any frontend host
        return origin || '*';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
}));

// Logger middleware
app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`[HTTP] ${c.req.method} ${c.req.url} -> ${c.res.status} (${ms}ms)`);
});

// Database Auto-Connect Middleware (For Serverless Vercel & Persistent Node)
app.use('/api/*', async (c, next) => {
    // Never block CORS preflight OPTIONS requests with DB connection
    if (c.req.method === 'OPTIONS') {
        return next();
    }
    try {
        await connectDB();
    } catch (dbErr) {
        console.error('Database connection failed:', dbErr.message);
        return c.json({ error: 'Database unavailable', message: dbErr.message }, 503);
    }
    await next();
});

// Root & Healthcheck
app.get('/', (c) => {
    return c.json({
        service: 'HealiiX Healthcare & Doctor Directory API',
        status: 'online',
        version: '1.0.0',
        routes: {
            patientProfile: '/u/:username',
            doctorProfile: '/d/:username',
            adminProfile: '/admin/profile',
            api: '/api',
            doctors: '/api/doctors',
            auth: '/api/auth',
        },
    });
});

// Diagnostic endpoint to inspect Vercel environment
app.get('/api/diagnostic', async (c) => {
    const hasUri = !!process.env.MONGODB_URI;
    const uriPrefix = process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'MISSING';
    const hasJwt = !!process.env.JWT_SECRET;
    const hasCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;
    let dbStatus = 'disconnected';
    let dbError = null;

    try {
        const start = Date.now();
        await connectDB();
        dbStatus = `connected (${Date.now() - start}ms)`;
    } catch (err) {
        dbStatus = 'failed';
        dbError = err.message;
    }

    return c.json({
        timestamp: new Date().toISOString(),
        hasUri,
        uriPrefix,
        hasJwt,
        hasCloudinary,
        dbStatus,
        dbError,
    });
});

app.get('/health', (c) => {
    return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mount API routes under /api (Dedicated API Routers FIRST)
app.route('/api/auth', authRoutes);
app.route('/api/doctors', doctorRoutes);
app.route('/api/appointments', appointmentRoutes);
app.route('/api/reviews', reviewRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/contact', contactRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/notifications', notificationRoutes);

// Direct clean profile & vanity URLs: /u/:username, /d/:username, /admin/*
app.route('/', profileRoutes);

// Serve Frontend Static Files cleanly from root (/) and /frontend/* alias (if frontend exists in directory)
if (fs.existsSync(FRONTEND_DIR)) {
    const relativeFrontendPath = path.relative(process.cwd(), FRONTEND_DIR).replace(/\\/g, '/') || './';
    app.use('/frontend/*', serveStatic({
        root: relativeFrontendPath,
        rewriteRequestPath: (p) => p.replace(/^\/frontend/, ''),
    }));
    app.use('/*', serveStatic({ root: relativeFrontendPath }));
}

// 404 Fallback
app.notFound((c) => {
    return c.json({
        success: false,
        message: `Endpoint ${c.req.path} not found on this server.`,
    }, 404);
});

// Global Error Handler
app.onError((err, c) => {
    console.error('[Unhandled Error]', err);
    return c.json({
        success: false,
        message: err.message || 'Internal Server Error',
    }, 500);
});

export default app;
