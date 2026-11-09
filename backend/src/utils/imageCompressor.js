import sharp from 'sharp';
import cloudinary from '../config/cloudinary.js';

/**
 * Compresses an image aggressively and converts it to WebP format,
 * then uploads directly to Cloudinary.
 * 
 * @param {string|Buffer} imageInput - Base64 data URI or raw Buffer
 * @param {object} options - { folder, maxWidth, quality }
 * @returns {Promise<string>} Secure Cloudinary WebP URL
 */
export async function compressAndUploadToWebP(imageInput, options = {}) {
    if (!imageInput) return '';

    const {
        folder = 'healx_uploads',
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 75,
    } = options;

    let inputBuffer;

    if (Buffer.isBuffer(imageInput)) {
        inputBuffer = imageInput;
    } else if (typeof imageInput === 'string') {
        // Strip data:image/...;base64, prefix if present
        const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, '');
        inputBuffer = Buffer.from(base64Data, 'base64');
    } else {
        throw new Error('Invalid image input format. Expected Buffer or base64 string.');
    }

    // High-performance compression & WebP conversion via Sharp
    const webpBuffer = await sharp(inputBuffer)
        .resize({
            width: maxWidth,
            height: maxHeight,
            fit: 'inside',
            withoutEnlargement: true,
        })
        .webp({
            quality,
            effort: 6, // High compression effort for smallest possible size
        })
        .toBuffer();

    // Upload the compressed WebP buffer to Cloudinary
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                format: 'webp',
                resource_type: 'image',
            },
            (error, result) => {
                if (error) {
                    console.error('[Cloudinary Upload Error]', error);
                    return reject(new Error(`Image upload failed: ${error.message}`));
                }
                resolve(result.secure_url);
            }
        );

        uploadStream.end(webpBuffer);
    });
}

