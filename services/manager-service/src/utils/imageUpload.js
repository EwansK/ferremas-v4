const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

class ImageUpload {
  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads/products';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB
    this.allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,webp').split(',');
    
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    fs.ensureDirSync(this.uploadPath);
  }

  // Multer storage configuration
  getStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        // Create product-specific directory
        const productId = req.params.id || 'temp';
        const productDir = path.join(this.uploadPath, productId);
        
        fs.ensureDirSync(productDir);
        cb(null, productDir);
      },
      filename: (req, file, cb) => {
        // Generate filename: timestamp-originalname
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const filename = `${timestamp}-${name}${ext}`;
        cb(null, filename);
      }
    });
  }

  // File filter function
  fileFilter = (req, file, cb) => {
    // Check file type
    const ext = path.extname(file.originalname).toLowerCase().substr(1);
    
    if (!this.allowedTypes.includes(ext)) {
      return cb(new Error(`File type not allowed. Allowed types: ${this.allowedTypes.join(', ')}`), false);
    }

    // Check MIME type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only images are allowed.'), false);
    }

    cb(null, true);
  };

  // Get multer middleware
  getUploadMiddleware() {
    return multer({
      storage: this.getStorage(),
      limits: {
        fileSize: this.maxFileSize
      },
      fileFilter: this.fileFilter
    });
  }

  // Single file upload middleware
  single(fieldName = 'image') {
    return this.getUploadMiddleware().single(fieldName);
  }

  // Multiple files upload middleware
  array(fieldName = 'images', maxCount = 5) {
    return this.getUploadMiddleware().array(fieldName, maxCount);
  }

  // Generate image URL
  generateImageUrl(productId, filename) {
    const baseUrl = process.env.IMAGE_BASE_URL || '/uploads/products';
    return `${baseUrl}/${productId}/${filename}`;
  }

  // Delete image file
  async deleteImage(productId, filename) {
    try {
      const filePath = path.join(this.uploadPath, productId, filename);
      await fs.remove(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  // Delete all images for a product
  async deleteProductImages(productId) {
    try {
      const productDir = path.join(this.uploadPath, productId);
      await fs.remove(productDir);
      return true;
    } catch (error) {
      console.error('Error deleting product images:', error);
      return false;
    }
  }

  // Get image info
  getImageInfo(file) {
    return {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    };
  }

  // Validate uploaded file
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file uploaded');
      return { isValid: false, errors };
    }

    if (file.size > this.maxFileSize) {
      errors.push(`File size must be less than ${Math.round(this.maxFileSize / 1024 / 1024)}MB`);
    }

    const ext = path.extname(file.originalname).toLowerCase().substr(1);
    if (!this.allowedTypes.includes(ext)) {
      errors.push(`File type must be one of: ${this.allowedTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Move temp file to product directory
  async moveToProductDir(tempFile, productId) {
    try {
      const tempPath = tempFile.path;
      const productDir = path.join(this.uploadPath, productId);
      const newPath = path.join(productDir, tempFile.filename);

      await fs.ensureDir(productDir);
      await fs.move(tempPath, newPath);

      return this.generateImageUrl(productId, tempFile.filename);
    } catch (error) {
      console.error('Error moving file:', error);
      throw error;
    }
  }
}

module.exports = new ImageUpload();