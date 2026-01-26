require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');
const fs = require('fs');

const reviewRoutes = require('./routes/reviewRoutes');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingsRoutes = require('./routes/bookingsRoutes');
const providersRoutes = require('./routes/providers');
const serviceRequestsRoutes = require('./routes/serviceRequests');

const app = express();
const port = process.env.PORT || 5000;


app.use(cors({
  origin: true,      // allow all origins
  credentials: true
}));

app.use(bodyParser.json());


const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/test-db', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT 1 + 1 AS solution');
    res.json({ message: 'Database connected', solution: rows[0].solution });
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
  res.send('Welcome to the JiraniConnect Backend!');
});


app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
