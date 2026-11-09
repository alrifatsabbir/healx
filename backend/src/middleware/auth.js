import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const JWT_SECRET = process.env.JWT_SECRET || 'healx-secret-fallback-key';

export function generateToken(userId, role) {
    return jwt.sign({ id: userId, role }, JWT_SECRET, {
        expiresIn: '7d',
    });
}

// Middleware: Verify JWT and attach current user to context
export async function requireAuth(c, next) {
    const authHeader = c.req.header('authorization') || c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({
            success: false,
            message: 'Access denied. Bearer token missing.',
        }, 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user || !user.isActive) {
            return c.json({
                success: false,
                message: 'User account not found or deactivated.',
            }, 401);
        }

        c.set('user', user);
        await next();
    } catch (err) {
        return c.json({
            success: false,
            message: 'Invalid or expired authentication token.',
        }, 401);
    }
}

// Middleware: Restrict access by roles (e.g. requireRole('admin', 'doctor'))
export function requireRole(...roles) {
    return async (c, next) => {
        const user = c.get('user');
        if (!user || !roles.includes(user.role)) {
            return c.json({
                success: false,
                message: `Forbidden. Requires one of roles: ${roles.join(', ')}`,
            }, 403);
        }
        await next();
    };
}

