const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/products',      require('./routes/productRoutes'));
app.use('/api/customers',     require('./routes/customerRoutes'));
app.use('/api/sales',         require('./routes/salesRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reports',       require('./routes/reportRoutes'));
app.use('/api/suppliers',     require('./routes/supplierRoutes'));   // ← NEW

app.get('/', (req, res) => res.json({ message: 'ClickBuy API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));