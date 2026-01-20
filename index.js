require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const bodyParser = require('body-parser');
const path    = require('path');
const db      = require('./db');

const reviewRoutes           = require('./routes/reviewRoutes');
const authRoutes             = require('./routes/authRoutes');
const serviceRoutes          = require('./routes/serviceRoutes');
const bookingsRoutes         = require('./routes/bookingsRoutes');
const providersRoutes        = require('./routes/providers');        
const serviceRequestsRoutes  = require('./routes/serviceRequests');

const app  = express();
const port = process.env.PORT || 5000;


const allowedOrigins = [
  'http://localhost:5173',
  'https://serviceprovision-jirani.vercel.app/', 
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like Postman) or allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin); 
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/test-db', async (req, res) => {
  try {
    const [results] = await db.query('SELECT 1 + 1 AS solution');
    res.json({ message: 'Database connected', solution: results[0].solution });
  } catch (error) {
    console.error('Database connection error:', error.message);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

app.use('/api/reviews',          reviewRoutes);
app.use('/api/auth',             authRoutes);
app.use('/api/services',         serviceRoutes);
app.use('/api/bookings',         bookingsRoutes);
app.use('/api/providers',        providersRoutes);
app.use('/api/service-requests', serviceRequestsRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the JiraniConnect Backend!');
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});