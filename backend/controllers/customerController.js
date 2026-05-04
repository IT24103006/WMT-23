const Customer = require('../models/Customer');
const { deleteImage } = require('../config/cloudinary');

const isValidPhone = (p) => /^\d{10}$/.test(p);
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, creditLimit } = req.body;

    // ── Validations ────────────────────────────────────────────────────────
    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    if (name.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    if (phone && !isValidPhone(phone))
      return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });
    if (email && !isValidEmail(email))
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    if (creditLimit !== undefined) {
      if (isNaN(Number(creditLimit)) || Number(creditLimit) < 0)
        return res.status(400).json({ success: false, message: 'Credit limit must be 0 or more' });
      if (Number(creditLimit) > 10_000_000)
        return res.status(400).json({ success: false, message: 'Credit limit max is 10,000,000' });
    }
    // ───────────────────────────────────────────────────────────────────────

    const image = req.file ? { url: req.file.path, public_id: req.file.filename } : undefined;
    const customer = await Customer.create({
      name: name.trim(), phone, email, address,
      creditLimit: Number(creditLimit) || 10000, image, createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const { name, phone, email, address, creditLimit } = req.body;

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ success: false, message: 'Name cannot be empty' });
      customer.name = name.trim();
    }
    if (phone !== undefined) {
      if (phone && !isValidPhone(phone))
        return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });
      customer.phone = phone;
    }
    if (email !== undefined) {
      if (email && !isValidEmail(email))
        return res.status(400).json({ success: false, message: 'Invalid email address' });
      customer.email = email;
    }
    if (address !== undefined) customer.address = address;
    if (creditLimit !== undefined) {
      if (isNaN(Number(creditLimit)) || Number(creditLimit) < 0)
        return res.status(400).json({ success: false, message: 'Credit limit must be 0 or more' });
      // Do not allow lowering limit below current balance
      if (Number(creditLimit) < customer.creditBalance)
        return res.status(400).json({
          success: false,
          message: `Cannot set credit limit below current balance (Rs. ${customer.creditBalance})`
        });
      customer.creditLimit = Number(creditLimit);
    }
    if (req.file) {
      if (customer.image?.public_id) await deleteImage(customer.image.public_id);
      customer.image = { url: req.file.path, public_id: req.file.filename };
    }
    await customer.save();
    res.json({ success: true, data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    if (customer.image?.public_id) await deleteImage(customer.image.public_id);
    await customer.deleteOne();
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteCustomerImage = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    if (customer.image?.public_id) await deleteImage(customer.image.public_id);
    customer.image = undefined;
    await customer.save();
    res.json({ success: true, message: 'Image removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/customers/:id/payments
exports.addPayment = async (req, res) => {
  try {
    const { amount, note, type } = req.body;

    // ── Validations ────────────────────────────────────────────────────────
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    if (!['credit', 'payment'].includes(type || 'payment'))
      return res.status(400).json({ success: false, message: 'Type must be credit or payment' });
    // ───────────────────────────────────────────────────────────────────────

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const parsedAmount = Number(amount);

    if (type === 'credit') {
      // Enforce credit limit
      const newBalance = customer.creditBalance + parsedAmount;
      if (newBalance > customer.creditLimit)
        return res.status(400).json({
          success: false,
          message: `Exceeds credit limit. Available credit: Rs. ${customer.creditLimit - customer.creditBalance}`
        });
      customer.creditBalance = newBalance;
    } else {
      if (parsedAmount > customer.creditBalance)
        return res.status(400).json({
          success: false,
          message: `Payment exceeds outstanding balance (Rs. ${customer.creditBalance})`
        });
      customer.creditBalance = Math.max(0, customer.creditBalance - parsedAmount);
    }

    customer.payments.push({ amount: parsedAmount, note, type: type || 'payment' });
    await customer.save();
    res.json({ success: true, data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};