const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  itemName:    { type: String, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, required: true, min: 0 },
  totalPrice:  { type: Number },
  date:        { type: Date, default: Date.now },
  note:        String,
});

const supplierSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  phone:       { type: String },
  email:       { type: String },
  address:     { type: String },
  company:     { type: String },
  debtBalance: { type: Number, default: 0 },      // how much we owe supplier
  purchases:   [purchaseSchema],
  image:       { url: String, public_id: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);