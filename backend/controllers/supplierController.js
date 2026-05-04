const Supplier = require('../models/Supplier');
const { deleteImage } = require('../config/cloudinary');

// ── helpers ──────────────────────────────────────────────────────────────────
const isValidPhone = (p) => /^\d{10}$/.test(p);
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// GET /api/suppliers
exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/suppliers/:id
exports.getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/suppliers
exports.createSupplier = async (req, res) => {
  try {
    const { name, phone, email, address, company } = req.body;

    // Validations
    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
    if (name.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    if (phone && !isValidPhone(phone))
      return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });
    if (email && !isValidEmail(email))
      return res.status(400).json({ success: false, message: 'Invalid email address' });

    const image = req.file ? { url: req.file.path, public_id: req.file.filename } : undefined;
    const supplier = await Supplier.create({
      name: name.trim(), phone, email, address, company, image, createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/suppliers/:id
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    const { name, phone, email, address, company } = req.body;

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ success: false, message: 'Name cannot be empty' });
      if (name.trim().length < 2) return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
      supplier.name = name.trim();
    }
    if (phone !== undefined) {
      if (phone && !isValidPhone(phone))
        return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });
      supplier.phone = phone;
    }
    if (email !== undefined) {
      if (email && !isValidEmail(email))
        return res.status(400).json({ success: false, message: 'Invalid email address' });
      supplier.email = email;
    }
    if (address !== undefined) supplier.address = address;
    if (company !== undefined) supplier.company = company;

    if (req.file) {
      if (supplier.image?.public_id) await deleteImage(supplier.image.public_id);
      supplier.image = { url: req.file.path, public_id: req.file.filename };
    }

    await supplier.save();
    res.json({ success: true, data: supplier });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/suppliers/:id
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    if (supplier.image?.public_id) await deleteImage(supplier.image.public_id);
    await supplier.deleteOne();
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/suppliers/:id/image
exports.deleteSupplierImage = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    if (supplier.image?.public_id) await deleteImage(supplier.image.public_id);
    supplier.image = undefined;
    await supplier.save();
    res.json({ success: true, message: 'Image removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/suppliers/:id/purchases  — record a purchase from supplier
exports.addPurchase = async (req, res) => {
  try {
    const { itemName, quantity, unitPrice, note } = req.body;

    // Validations
    if (!itemName || !itemName.trim())
      return res.status(400).json({ success: false, message: 'Item name is required' });
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 1)
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    if (!unitPrice || isNaN(Number(unitPrice)) || Number(unitPrice) < 0)
      return res.status(400).json({ success: false, message: 'Unit price must be 0 or more' });

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    const totalPrice = Number(quantity) * Number(unitPrice);
    supplier.purchases.push({ itemName: itemName.trim(), quantity: Number(quantity), unitPrice: Number(unitPrice), totalPrice, note });
    supplier.debtBalance += totalPrice;   // we owe supplier this amount
    await supplier.save();
    res.json({ success: true, data: supplier });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/suppliers/:id/payments  — record payment to supplier (reduces debt)
exports.addPayment = async (req, res) => {
  try {
    const { amount, note } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    if (Number(amount) > supplier.debtBalance)
      return res.status(400).json({ success: false, message: `Payment exceeds current debt (Rs. ${supplier.debtBalance})` });

    supplier.debtBalance = Math.max(0, supplier.debtBalance - Number(amount));
    await supplier.save();
    res.json({ success: true, data: supplier });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};