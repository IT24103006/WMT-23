const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:      String,
  price:     Number,
  quantity:  { type: Number, required: true, min: 1 },
  subtotal:  Number,
});

const saleSchema = new mongoose.Schema({
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  items:       [saleItemSchema],
  totalAmount: { type: Number, required: true },
  paidAmount:  { type: Number, default: 0 },
  dueAmount:   { type: Number, default: 0 },
  status:      { type: String, enum: ['paid', 'partial', 'credit'], default: 'paid' },
  date:        { type: Date, default: Date.now },
  image:       { url: String, public_id: String }, // invoice/receipt image
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
