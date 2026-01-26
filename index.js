require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const reviewRoutes = require('./routes/reviewRoutes');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingsRoutes = require('./routes/bookingsRoutes');
const providersRoutes = require('./routes/providers');
const serviceRequestsRoutes = require('./routes/serviceRequests');

const app = express();
const port = process.env.PORT || 5000;


app.use(
  cors({
    origin: true, 
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const uploadsDir = path.join(__dirname, 'uploads');
const imagesDir = path.join(__dirname, 'images');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });


app.use('/uploads', express.static(uploadsDir));
app.use('/images', express.static(imagesDir));


app.get('/test-db', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT 1 + 1 AS solution');
    res.json({
      message: 'Database connected',
      solution: rows[0].solution,
    });
  } catch (error) {
    console.error('Database connection error:', error.message);
    res.status(500).json({ message: 'Database connection failed' });
  }
});


app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/service-requests', serviceRequestsRoutes);


app.get('/', (req, res) => {
  res.send('Welcome to the JiraniConnect Backend ');
});


app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});


app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
