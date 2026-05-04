const express = require('express');
const router = express.Router();
const {
  getNotifications, getNotification, createNotification, markRead,
  deleteNotification, deleteNotificationImage, generateAlerts
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { createUploader } = require('../config/cloudinary');

const upload = createUploader('notifications');

router.route('/')
  .get(protect, getNotifications)
  .post(protect, upload.single('image'), createNotification);

router.get('/generate', protect, generateAlerts);

router.route('/:id')
  .get(protect, getNotification)
  .delete(protect, deleteNotification);

router.put('/:id/read', protect, markRead);
router.delete('/:id/image', protect, deleteNotificationImage);

module.exports = router;
