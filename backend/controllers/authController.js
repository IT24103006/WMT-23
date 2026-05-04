const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { deleteImage } = require('../config/cloudinary');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email & password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const image = req.file
      ? { url: req.file.path, public_id: req.file.filename }
      : undefined;

    const user = await User.create({ name, email, password, phone, role, image });
    res.status(201).json({ success: true, token: generateToken(user._id), user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email & password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    res.json({ success: true, token: generateToken(user._id), user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: sanitize(req.user) });
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (req.file) {
      if (user.image?.public_id) await deleteImage(user.image.public_id);
      user.image = { url: req.file.path, public_id: req.file.filename };
    }
    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();
    res.json({ success: true, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/auth/profile-image
exports.deleteProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.image?.public_id) await deleteImage(user.image.public_id);
    user.image = undefined;
    await user.save();
    res.json({ success: true, message: 'Profile image removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sanitize = (u) => ({
  _id: u._id, name: u.name, email: u.email,
  phone: u.phone, role: u.role, image: u.image,
  createdAt: u.createdAt,
});
