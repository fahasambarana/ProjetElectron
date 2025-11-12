const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const stockRoute = require('./routes/stockRoute');
const eventRoutes = require('./routes/eventRoutes')
const empruntRoutes = require('./routes/empruntRoutes');
const authRoutes = require('./routes/AuthRoutes');
const studentRoutes = require('./routes/studentRoutes');
const alertRoutes = require('./routes/alertRoutes');
require('./cron/alertCron');

dotenv.config();
const app = express();

// ✅ CORRECTION : Middlewares dans le bon ordre
app.use(cors()); // CORS en premier
app.use(express.json()); // Parser JSON
app.use(express.urlencoded({ extended: true })); // Parser URL-encoded

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stock_db';

connectDB(MONGO_URI);

// Dans votre app.js, avant les autres routes
app.post('/api/debug', (req, res) => {
  console.log('=== DEBUG REQUEST ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Content-Type:', req.get('Content-Type'));
  
  res.json({
    success: true,
    bodyReceived: req.body,
    contentType: req.get('Content-Type')
  });
});
// Routes
app.use('/api/stocks', stockRoute);
app.use("/api/events", eventRoutes);
app.use("/api/emprunts", empruntRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/alertes', alertRoutes);
app.use("/uploads", express.static("uploads"));

app.get('/', (req, res) => res.send('API stocks fonctionne'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));