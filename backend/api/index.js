import { handle } from 'hono/vercel';
import { app } from '../src/app.js';

export const config = {
    maxDuration: 15,
};

export default handle(app);
