const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  type:        { type: String, enum: ['sales', 'customer_balance', 'stock', 'custom'], default: 'custom' },
  description: { type: String, default: '' },
  saleRef:     { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
  period:      { startDate: Date, endDate: Date },
  summary:     { type: mongoose.Schema.Types.Mixed },
  image:       { url: String, public_id: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);