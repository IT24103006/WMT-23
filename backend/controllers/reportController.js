const Report = require('../models/Report');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { deleteImage } = require('../config/cloudinary');

const VALID_TYPES = ['daily', 'weekly', 'monthly', 'custom'];

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/reports/summary — live summary (not saved)
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date params if provided
    if (startDate && isNaN(Date.parse(startDate)))
      return res.status(400).json({ success: false, message: 'Invalid startDate format' });
    if (endDate && isNaN(Date.parse(endDate)))
      return res.status(400).json({ success: false, message: 'Invalid endDate format' });
    if (startDate && endDate && new Date(startDate) > new Date(endDate))
      return res.status(400).json({ success: false, message: 'startDate cannot be after endDate' });

    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }

    const sales          = await Sale.find(filter);
    const totalSales     = sales.reduce((s, r) => s + r.totalAmount, 0);
    const totalCollected = sales.reduce((s, r) => s + r.paidAmount,  0);
    const totalDue       = sales.reduce((s, r) => s + r.dueAmount,   0);

    const customers      = await Customer.find();
    const totalCustomers = customers.length;
    const totalCredit    = customers.reduce((s, c) => s + c.creditBalance, 0);

    const products       = await Product.find();
    const lowStockCount  = products.filter(p => p.quantity <= 5).length;

    res.json({
      success: true,
      summary: { totalSales, totalCollected, totalDue, totalCustomers, totalCredit, lowStockCount, saleCount: sales.length }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createReport = async (req, res) => {
  try {
    const { title, type, description, saleRef, startDate, endDate } = req.body;

    // ── Validations ────────────────────────────────────────────────────────
    if (!title || !title.trim())
      return res.status(400).json({ success: false, message: 'Report title is required' });
    if (title.trim().length < 3)
      return res.status(400).json({ success: false, message: 'Title must be at least 3 characters' });
    if (title.trim().length > 150)
      return res.status(400).json({ success: false, message: 'Title max 150 characters' });
    if (type && !VALID_TYPES.includes(type))
      return res.status(400).json({ success: false, message: `Type must be one of: ${VALID_TYPES.join(', ')}` });
    if (description && description.length > 1000)
      return res.status(400).json({ success: false, message: 'Description max 1000 characters' });
    if (startDate && isNaN(Date.parse(startDate)))
      return res.status(400).json({ success: false, message: 'Invalid startDate format' });
    if (endDate && isNaN(Date.parse(endDate)))
      return res.status(400).json({ success: false, message: 'Invalid endDate format' });
    if (startDate && endDate && new Date(startDate) > new Date(endDate))
      return res.status(400).json({ success: false, message: 'startDate cannot be after endDate' });
    // ───────────────────────────────────────────────────────────────────────

    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }
    const sales = await Sale.find(filter);
    const summary = {
      totalSales:     sales.reduce((s, r) => s + r.totalAmount, 0),
      totalCollected: sales.reduce((s, r) => s + r.paidAmount,  0),
      totalDue:       sales.reduce((s, r) => s + r.dueAmount,   0),
      saleCount: sales.length,
    };

    const image = req.file ? { url: req.file.path, public_id: req.file.filename } : undefined;
    const report = await Report.create({
      title: title.trim(), type: type || 'custom',
      description: description || '', saleRef: saleRef || undefined,
      period: { startDate, endDate }, summary, image, createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Not found' });
    if (report.image?.public_id) await deleteImage(report.image.public_id);
    await report.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteReportImage = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Not found' });
    if (report.image?.public_id) await deleteImage(report.image.public_id);
    report.image = undefined;
    await report.save();
    res.json({ success: true, message: 'Image removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};