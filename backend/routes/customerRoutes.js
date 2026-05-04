const express = require('express');
const router = express.Router();
const {
  getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer,
  deleteCustomerImage, addPayment
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');
const { createUploader } = require('../config/cloudinary');

const upload = createUploader('customers');

router.route('/')
  .get(protect, getCustomers)
  .post(protect, upload.single('image'), createCustomer);

router.route('/:id')
  .get(protect, getCustomer)
  .put(protect, upload.single('image'), updateCustomer)
  .delete(protect, deleteCustomer);

router.delete('/:id/image', protect, deleteCustomerImage);
router.post('/:id/payments', protect, addPayment);

module.exports = router;
