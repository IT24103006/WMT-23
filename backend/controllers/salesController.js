const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { deleteImage } = require('../config/cloudinary');

exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('customer', 'name phone')
      .populate('items.product', 'name price')
      .sort({ date: -1 });
    res.json({ success: true, count: sales.length, data: sales });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('items.product', 'name price');
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createSale = async (req, res) => {
  try {
    let { customerId, items, paidAmount, status } = req.body;

    // items arrives as a JSON string when sent via FormData
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch { items = []; }
    }

    // ── Validations ────────────────────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    if (items.length > 100)
      return res.status(400).json({ success: false, message: 'Too many items (max 100 per sale)' });

    for (const item of items) {
      if (!item.productId)
        return res.status(400).json({ success: false, message: 'Each item must have a productId' });
      if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) < 1)
        return res.status(400).json({ success: false, message: 'Each item quantity must be at least 1' });
      if (!Number.isInteger(Number(item.quantity)))
        return res.status(400).json({ success: false, message: 'Item quantity must be a whole number' });
    }

    const paid = isNaN(Number(paidAmount)) ? 0 : Math.max(0, Number(paidAmount));

    if (customerId) {
      const customerExists = await Customer.findById(customerId);
      if (!customerExists)
        return res.status(404).json({ success: false, message: 'Selected customer not found' });
    }
    // ───────────────────────────────────────────────────────────────────────

    let totalAmount = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product)
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      if (product.quantity < Number(item.quantity))
        return res.status(400).json({ success: false, message: `Insufficient stock for "${product.name}". Available: ${product.quantity}` });

      const subtotal = product.price * Number(item.quantity);
      totalAmount += subtotal;
      saleItems.push({ product: product._id, name: product.name, price: product.price, quantity: Number(item.quantity), subtotal });

      product.quantity -= Number(item.quantity);
      await product.save();
    }

    if (paid > totalAmount)
      return res.status(400).json({ success: false, message: 'Paid amount cannot exceed total amount' });

    const due = totalAmount - paid;
    const image = req.file ? { url: req.file.path, public_id: req.file.filename } : undefined;

    // Check customer credit limit before adding to balance
    if (customerId && due > 0) {
      const customer = await Customer.findById(customerId);
      if (customer.creditBalance + due > customer.creditLimit)
        return res.status(400).json({
          success: false,
          message: `This sale would exceed ${customer.name}'s credit limit. Available: Rs. ${customer.creditLimit - customer.creditBalance}`
        });
    }

    const sale = await Sale.create({
      customer: customerId || undefined,
      items: saleItems,
      totalAmount,
      paidAmount: paid,
      dueAmount: due,
      status: status || (due <= 0 ? 'paid' : paid > 0 ? 'partial' : 'credit'),
      image,
      createdBy: req.user._id,
    });

    if (customerId && due > 0) {
      await Customer.findByIdAndUpdate(customerId, { $inc: { creditBalance: due } });
    }

    res.status(201).json({ success: true, data: sale });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

    const validStatuses = ['paid', 'partial', 'credit'];
    if (req.body.status) {
      if (!validStatuses.includes(req.body.status))
        return res.status(400).json({ success: false, message: 'Status must be paid, partial, or credit' });
      sale.status = req.body.status;
    }
    if (req.file) {
      if (sale.image?.public_id) await deleteImage(sale.image.public_id);
      sale.image = { url: req.file.path, public_id: req.file.filename };
    }
    await sale.save();
    res.json({ success: true, data: sale });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    if (sale.image?.public_id) await deleteImage(sale.image.public_id);
    await sale.deleteOne();
    res.json({ success: true, message: 'Sale deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteSaleImage = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    if (sale.image?.public_id) await deleteImage(sale.image.public_id);
    sale.image = undefined;
    await sale.save();
    res.json({ success: true, message: 'Image removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};