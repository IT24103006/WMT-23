const Product = require('../models/Product');
const { deleteImage } = require('../config/cloudinary');

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { name, price, quantity, description } = req.body;

    // ── Validations ────────────────────────────────────────────────────────
    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: 'Product name is required' });
    if (name.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Product name must be at least 2 characters' });
    if (price === undefined || price === '')
      return res.status(400).json({ success: false, message: 'Price is required' });
    if (isNaN(Number(price)) || Number(price) < 0)
      return res.status(400).json({ success: false, message: 'Price must be 0 or more' });
    if (Number(price) > 10_000_000)
      return res.status(400).json({ success: false, message: 'Price seems too high (max 10,000,000)' });
    if (quantity !== undefined && (isNaN(Number(quantity)) || Number(quantity) < 0))
      return res.status(400).json({ success: false, message: 'Quantity must be 0 or more' });
    if (quantity !== undefined && !Number.isInteger(Number(quantity)))
      return res.status(400).json({ success: false, message: 'Quantity must be a whole number' });
    if (description && description.length > 500)
      return res.status(400).json({ success: false, message: 'Description max 500 characters' });
    // ───────────────────────────────────────────────────────────────────────

    const image = req.file ? { url: req.file.path, public_id: req.file.filename } : undefined;
    const product = await Product.create({
      name: name.trim(), price: Number(price),
      quantity: Number(quantity) || 0, description, image, createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { name, price, quantity, description } = req.body;

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ success: false, message: 'Name cannot be empty' });
      if (name.trim().length < 2) return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
      product.name = name.trim();
    }
    if (price !== undefined) {
      if (isNaN(Number(price)) || Number(price) < 0)
        return res.status(400).json({ success: false, message: 'Price must be 0 or more' });
      if (Number(price) > 10_000_000)
        return res.status(400).json({ success: false, message: 'Price seems too high (max 10,000,000)' });
      product.price = Number(price);
    }
    if (quantity !== undefined) {
      if (isNaN(Number(quantity)) || Number(quantity) < 0)
        return res.status(400).json({ success: false, message: 'Quantity must be 0 or more' });
      if (!Number.isInteger(Number(quantity)))
        return res.status(400).json({ success: false, message: 'Quantity must be a whole number' });
      product.quantity = Number(quantity);
    }
    if (description !== undefined) {
      if (description.length > 500)
        return res.status(400).json({ success: false, message: 'Description max 500 characters' });
      product.description = description;
    }
    if (req.file) {
      if (product.image?.public_id) await deleteImage(product.image.public_id);
      product.image = { url: req.file.path, public_id: req.file.filename };
    }

    await product.save();
    res.json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.image?.public_id) await deleteImage(product.image.public_id);
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/products/:id/image
exports.deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.image?.public_id) await deleteImage(product.image.public_id);
    product.image = undefined;
    await product.save();
    res.json({ success: true, message: 'Image removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};