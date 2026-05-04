const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount:  { type: Number, required: true },
  date:    { type: Date, default: Date.now },
  note:    String,
  type:    { type: String, enum: ['credit', 'payment'], default: 'payment' },
});

const customerSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  phone:         { type: String },
  email:         { type: String },
  address:       { type: String },
  creditBalance: { type: Number, default: 0 },
  creditLimit:   { type: Number, default: 10000 },
  payments:      [paymentSchema],
  image:         { url: String, public_id: String },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
