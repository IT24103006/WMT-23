const Notification = require('../models/Notification');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { deleteImage } = require('../config/cloudinary');

const VALID_TYPES = ['due_payment', 'low_stock', 'general'];

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getNotification = async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: n });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    // ── Validations ────────────────────────────────────────────────────────
    if (!title || !title.trim())
      return res.status(400).json({ success: false, message: 'Title is required' });
    if (title.trim().length < 3)
      return res.status(400).json({ success: false, message: 'Title must be at least 3 characters' });
    if (title.trim().length > 100)
      return res.status(400).json({ success: false, message: 'Title max 100 characters' });
    if (!message || !message.trim())
      return res.status(400).json({ success: false, message: 'Message is required' });
    if (message.trim().length < 5)
      return res.status(400).json({ success: false, message: 'Message must be at least 5 characters' });
    if (message.trim().length > 500)
      return res.status(400).json({ success: false, message: 'Message max 500 characters' });
    if (type && !VALID_TYPES.includes(type))
      return res.status(400).json({ success: false, message: `Type must be one of: ${VALID_TYPES.join(', ')}` });
    // ───────────────────────────────────────────────────────────────────────

    const image = req.file ? { url: req.file.path, public_id: req.file.filename } : undefined;
    const n = await Notification.create({
      title: title.trim(), message: message.trim(),
      type: type || 'general', image, createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: n });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.markRead = async (req, res) => {
  try {
    const n = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!n) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: n });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteNotification = async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ success: false, message: 'Not found' });
    if (n.image?.public_id) await deleteImage(n.image.public_id);
    await n.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteNotificationImage = async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ success: false, message: 'Not found' });
    if (n.image?.public_id) await deleteImage(n.image.public_id);
    n.image = undefined;
    await n.save();
    res.json({ success: true, message: 'Image removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Auto-generate alerts: GET /api/notifications/generate
exports.generateAlerts = async (req, res) => {
  try {
    const LOW_STOCK_THRESHOLD = 5;
    const generated = [];

    // Low stock alerts
    const lowStock = await Product.find({ quantity: { $lte: LOW_STOCK_THRESHOLD } });
    for (const p of lowStock) {
      await Notification.create({
        title: 'Low Stock Alert',
        message: `${p.name} has only ${p.quantity} unit(s) left.`,
        type: 'low_stock',
        ref: p._id, refModel: 'Product',
        createdBy: req.user._id,
      });
      generated.push(`Low stock: ${p.name}`);
    }

    // Overdue payment alerts
    const dueCustomers = await Customer.find({ creditBalance: { $gt: 0 } });
    for (const c of dueCustomers) {
      await Notification.create({
        title: 'Payment Due',
        message: `${c.name} has an outstanding balance of Rs. ${c.creditBalance.toLocaleString()}.`,
        type: 'due_payment',
        ref: c._id, refModel: 'Customer',
        createdBy: req.user._id,
      });
      generated.push(`Due payment: ${c.name}`);
    }

    res.json({ success: true, count: generated.length, generated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};