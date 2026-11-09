import { Hono } from 'hono';
import cloudinary from '../config/cloudinary.js';
import { requireAuth } from '../middleware/auth.js';

const upload = new Hono();

// POST /api/upload/image - Uploads base64 or file URL to Cloudinary
upload.post('/image', requireAuth, async (c) => {
    try {
        const body = await c.req.json();
        const { image, folder = 'healx_uploads' } = body;

        if (!image) {
            return c.json({ success: false, message: 'Image data (base64 or URL) is required.' }, 400);
        }

        const result = await cloudinary.uploader.upload(image, {
            folder,
            resource_type: 'auto',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        });

        return c.json({
            success: true,
            message: 'Image uploaded successfully.',
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

export default upload;

