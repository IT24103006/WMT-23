const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct, deleteProductImage
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { createUploader } = require('../config/cloudinary');

const upload = createUploader('products');

router.route('/')
  .get(protect, getProducts)
  .post(protect, upload.single('image'), createProduct);

router.route('/:id')
  .get(protect, getProduct)
  .put(protect, upload.single('image'), updateProduct)
  .delete(protect, deleteProduct);

router.delete('/:id/image', protect, deleteProductImage);

module.exports = router;
