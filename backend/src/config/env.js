import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

function extractOrigin(urlStr) {
    if (!urlStr) return null;
    try {
        return new URL(urlStr).origin;
    } catch (_) {
        return urlStr.replace(/\/+$/, '');
    }
}

export const env = {
    NODE_ENV,
    isProduction,
    PORT: Number(process.env.PORT) || 5000,

    // Active Resolved URLs based on NODE_ENV
    FRONTEND_URL: (isProduction && process.env.FRONTEND_URL_PROD)
        ? process.env.FRONTEND_URL_PROD.replace(/\/+$/, '')
        : (process.env.FRONTEND_URL_DEV || 'http://localhost:5500/frontend').replace(/\/+$/, ''),

    BACKEND_URL: (isProduction && process.env.BACKEND_URL_PROD)
        ? process.env.BACKEND_URL_PROD.replace(/\/+$/, '')
        : (process.env.BACKEND_URL_DEV || `http://localhost:${Number(process.env.PORT) || 5000}`).replace(/\/+$/, ''),

    AI_BOT_URL: (isProduction && process.env.AI_BOT_URL_PROD)
        ? process.env.AI_BOT_URL_PROD.replace(/\/+$/, '')
        : (process.env.AI_BOT_URL_DEV || 'http://localhost:8000').replace(/\/+$/, ''),

    // Explicit Separate Lists for Dev & Prod
    URLS: {
        DEV: {
            FRONTEND: process.env.FRONTEND_URL_DEV || 'http://localhost:5500/frontend',
            BACKEND: process.env.BACKEND_URL_DEV || 'http://localhost:5000',
            AI_BOT: process.env.AI_BOT_URL_DEV || 'http://localhost:8000',
        },
        PROD: {
            FRONTEND: process.env.FRONTEND_URL_PROD || '',
            BACKEND: process.env.BACKEND_URL_PROD || '',
            AI_BOT: process.env.AI_BOT_URL_PROD || '',
        },
    },

    // Normalized CORS Allowed Origins
    ALLOWED_ORIGINS: Array.from(new Set([
        extractOrigin(process.env.FRONTEND_URL_DEV),
        extractOrigin(process.env.FRONTEND_URL_PROD),
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ].filter(Boolean))),
};

export default env;

