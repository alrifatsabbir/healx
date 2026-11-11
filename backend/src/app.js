import { Hono } from 'hono';
import { cors } from 'hono/cors';
import env from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import profileRoutes from './routes/profile.routes.js';
import contactRoutes from './routes/contact.routes.js';

export const app = new Hono();

// Environment-aware CORS Middleware (Dev & Prod separated)
app.use('*', cors({
    origin: (origin) => {
        if (!origin) return '*';
        if (!env.isProduction) return origin;
        return env.ALLOWED_ORIGINS.includes(origin) ? origin : env.ALLOWED_ORIGINS[0] || '*';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}));

// Logger middleware
app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`[HTTP] ${c.req.method} ${c.req.url} -> ${c.res.status} (${ms}ms)`);
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
            api: '/api',
        },
    });
});

app.get('/health', (c) => {
    return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Direct profile URLs: /u/:username and /d/:username
app.route('/', profileRoutes);

// Mount under /api as well
app.route('/api', profileRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/doctors', doctorRoutes);
app.route('/api/appointments', appointmentRoutes);
app.route('/api/reviews', reviewRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/contact', contactRoutes);

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
