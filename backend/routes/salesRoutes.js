const express = require('express');
const router = express.Router();
const {
  getSales, getSale, createSale, updateSale, deleteSale, deleteSaleImage
} = require('../controllers/salesController');
const { protect } = require('../middleware/authMiddleware');
const { createUploader } = require('../config/cloudinary');

const upload = createUploader('invoices');

router.route('/')
  .get(protect, getSales)
  .post(protect, upload.single('image'), createSale);

router.route('/:id')
  .get(protect, getSale)
  .put(protect, upload.single('image'), updateSale)
  .delete(protect, deleteSale);

router.delete('/:id/image', protect, deleteSaleImage);

module.exports = router;
