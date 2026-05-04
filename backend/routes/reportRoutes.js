const express = require('express');
const router = express.Router();
const {
  getReports, getReport, getSummary, createReport, deleteReport, deleteReportImage
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { createUploader } = require('../config/cloudinary');

const upload = createUploader('reports');

router.get('/summary', protect, getSummary);

router.route('/')
  .get(protect, getReports)
  .post(protect, upload.single('image'), createReport);

router.route('/:id')
  .get(protect, getReport)
  .delete(protect, deleteReport);

router.delete('/:id/image', protect, deleteReportImage);

module.exports = router;
