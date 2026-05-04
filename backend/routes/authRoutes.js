const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, deleteProfileImage } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { createUploader } = require('../config/cloudinary');

const upload = createUploader('profiles');

router.post('/register', upload.single('image'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('image'), updateProfile);
router.delete('/profile-image', protect, deleteProfileImage);

module.exports = router;
