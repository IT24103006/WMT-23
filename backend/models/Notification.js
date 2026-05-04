const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String, enum: ['due_payment', 'low_stock', 'general'], default: 'general' },
  isRead:  { type: Boolean, default: false },
  image:   { url: String, public_id: String },
  ref:     { type: mongoose.Schema.Types.ObjectId }, // optional linked doc
  refModel:{ type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
