import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request } from 'express';
import { Readable } from 'stream';
import logger from './logger';
import { environment } from './environment';

// Configure Cloudinary
cloudinary.config({
  cloud_name: environment.CLOUDINARY_CLOUD_NAME,
  api_key: environment.CLOUDINARY_API_KEY,
  api_secret: environment.CLOUDINARY_API_SECRET,
});

// Multer memory storage for handling file uploads
const storage = multer.memoryStorage();

// File filter for attachments
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  // Allow most common file types
  const allowedMimes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed',
  ];

  // File size limit (10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn('Rejected file upload - unsupported type', {
      filename: file.originalname,
      mimetype: file.mimetype,
    });
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Max 10 files per request
  },
});

/**
 * Upload file buffer to Cloudinary
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  filename: string,
  options: {
    folder?: string;
    resource_type?: 'auto' | 'image' | 'video' | 'raw';
    format?: string;
  } = {}
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'spare-mails/attachments',
      resource_type: options.resource_type || 'auto' as const,
      public_id: `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      use_filename: true,
      unique_filename: false,
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed:', error);
          reject(error);
        } else {
          logger.info('File uploaded to Cloudinary', {
            public_id: result?.public_id,
            secure_url: result?.secure_url,
            bytes: result?.bytes,
          });
          resolve(result);
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info('File deleted from Cloudinary', {
      public_id: publicId,
      result: result.result,
    });
    return result;
  } catch (error) {
    logger.error('Failed to delete from Cloudinary:', error);
    throw error;
  }
};

/**
 * Generate optimized URL for file
 */
export const getOptimizedUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  } = {}
): string => {
  return cloudinary.url(publicId, {
    transformation: [
      {
        quality: options.quality || 'auto',
        fetch_format: options.format || 'auto',
        ...(options.width && { width: options.width }),
        ...(options.height && { height: options.height }),
      },
    ],
  });
};

/**
 * Process email attachments and upload to Cloudinary
 */
export const processEmailAttachments = async (
  attachments: Express.Multer.File[]
): Promise<Array<{
  filename: string;
  originalName: string;
  url: string;
  publicId: string;
  size: number;
  mimetype: string;
}>> => {
  const processedAttachments = [];

  for (const attachment of attachments) {
    try {
      const result = await uploadToCloudinary(
        attachment.buffer,
        attachment.originalname,
        {
          folder: 'spare-mails/email-attachments',
        }
      );

      processedAttachments.push({
        filename: attachment.originalname,
        originalName: attachment.originalname,
        url: result.secure_url,
        publicId: result.public_id,
        size: attachment.size,
        mimetype: attachment.mimetype,
      });
    } catch (error) {
      logger.error(`Failed to process attachment: ${attachment.originalname}`, error);
      // Continue processing other attachments even if one fails
    }
  }

  return processedAttachments;
};

export { cloudinary };
export default cloudinary;