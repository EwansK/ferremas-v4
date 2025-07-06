const database = require('../utils/database');
const validationUtils = require('../utils/validation');
const imageUpload = require('../utils/imageUpload');

class ImageController {
  // Upload image for a product
  uploadProductImage = async (req, res) => {
    try {
      // Validate product ID
      const { error, value } = validationUtils.validateIdParams(req.params);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { id: productId } = value;

      // Check if product exists
      const productResult = await database.query(
        'SELECT id, name FROM products WHERE id = $1',
        [productId]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      // Validate uploaded file
      const fileValidation = imageUpload.validateFile(req.file);
      if (!fileValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file',
          errors: fileValidation.errors
        });
      }

      // Generate image URL
      const imageUrl = imageUpload.generateImageUrl(productId, req.file.filename);

      // Update product with image URL
      await database.query(
        'UPDATE products SET image_link = $1 WHERE id = $2',
        [imageUrl, productId]
      );

      // Log activity
      await database.logActivity(
        req.user.id,
        'UPLOAD_IMAGE',
        'product',
        productId,
        null,
        { image_url: imageUrl, filename: req.file.filename },
        req.ip
      );

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          product_id: productId,
          image_url: imageUrl,
          file_info: {
            filename: req.file.filename,
            original_name: req.file.originalname,
            size: req.file.size,
            mime_type: req.file.mimetype
          }
        }
      });

    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading image'
      });
    }
  };

  // Remove image from product
  removeProductImage = async (req, res) => {
    try {
      // Validate product ID
      const { error, value } = validationUtils.validateIdParams(req.params);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { id: productId } = value;

      // Get product with current image
      const productResult = await database.query(
        'SELECT id, name, image_link FROM products WHERE id = $1',
        [productId]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const product = productResult.rows[0];

      if (!product.image_link) {
        return res.status(400).json({
          success: false,
          message: 'Product has no image to remove'
        });
      }

      // Extract filename from image URL
      const urlParts = product.image_link.split('/');
      const filename = urlParts[urlParts.length - 1];

      // Delete image file
      const deleteSuccess = await imageUpload.deleteImage(productId, filename);

      // Update product to remove image URL
      await database.query(
        'UPDATE products SET image_link = NULL WHERE id = $1',
        [productId]
      );

      // Log activity
      await database.logActivity(
        req.user.id,
        'REMOVE_IMAGE',
        'product',
        productId,
        { image_url: product.image_link },
        null,
        req.ip
      );

      res.json({
        success: true,
        message: 'Image removed successfully',
        data: {
          product_id: productId,
          file_deleted: deleteSuccess
        }
      });

    } catch (error) {
      console.error('Remove image error:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing image'
      });
    }
  };

  // Update product image (replace existing)
  updateProductImage = async (req, res) => {
    try {
      // Validate product ID
      const { error, value } = validationUtils.validateIdParams(req.params);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { id: productId } = value;

      // Check if product exists and get current image
      const productResult = await database.query(
        'SELECT id, name, image_link FROM products WHERE id = $1',
        [productId]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const product = productResult.rows[0];

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      // Validate uploaded file
      const fileValidation = imageUpload.validateFile(req.file);
      if (!fileValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file',
          errors: fileValidation.errors
        });
      }

      // Delete old image if exists
      if (product.image_link) {
        const urlParts = product.image_link.split('/');
        const oldFilename = urlParts[urlParts.length - 1];
        await imageUpload.deleteImage(productId, oldFilename);
      }

      // Generate new image URL
      const imageUrl = imageUpload.generateImageUrl(productId, req.file.filename);

      // Update product with new image URL
      await database.query(
        'UPDATE products SET image_link = $1 WHERE id = $2',
        [imageUrl, productId]
      );

      // Log activity
      await database.logActivity(
        req.user.id,
        'UPDATE_IMAGE',
        'product',
        productId,
        { old_image_url: product.image_link },
        { new_image_url: imageUrl, filename: req.file.filename },
        req.ip
      );

      res.json({
        success: true,
        message: 'Image updated successfully',
        data: {
          product_id: productId,
          old_image_url: product.image_link,
          new_image_url: imageUrl,
          file_info: {
            filename: req.file.filename,
            original_name: req.file.originalname,
            size: req.file.size,
            mime_type: req.file.mimetype
          }
        }
      });

    } catch (error) {
      console.error('Update image error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating image'
      });
    }
  };
}

module.exports = new ImageController();