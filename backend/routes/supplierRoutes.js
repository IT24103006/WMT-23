const express = require('express');
const router = express.Router();
const {
  getSuppliers, getSupplier, createSupplier, updateSupplier,
  deleteSupplier, deleteSupplierImage, addPurchase, addPayment
} = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');
const { createUploader } = require('../config/cloudinary');

const upload = createUploader('suppliers');

router.route('/')
  .get(protect, getSuppliers)
  .post(protect, upload.single('image'), createSupplier);

router.route('/:id')
  .get(protect, getSupplier)
  .put(protect, upload.single('image'), updateSupplier)
  .delete(protect, deleteSupplier);

router.delete('/:id/image', protect, deleteSupplierImage);
router.post('/:id/purchases', protect, addPurchase);
router.post('/:id/payments', protect, addPayment);

module.exports = router;