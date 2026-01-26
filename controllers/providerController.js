const db = require('../db');
const multer = require('multer');
const path = require('path');
const NodeGeocoder = require('node-geocoder');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});
exports.upload = multer({ storage });

// Geocoder
const geocoder = NodeGeocoder({ provider: 'openstreetmap' });


exports.getMySummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows: provRows } = await db.query(
      'SELECT id FROM service_providers WHERE user_id = $1',
      [userId]
    );

    if (!provRows.length) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const providerId = provRows[0].id;

    const { rows } = await db.query(
      `
      SELECT
        COUNT(sr.id) AS "totalRequests",
        COUNT(CASE WHEN sr.status = 'completed' THEN 1 END) AS "completedRequests",
        COALESCE(AVG(r.rating), 0) AS "averageRating",
        COUNT(r.id) AS "totalReviews"
      FROM service_requests sr
      LEFT JOIN reviews r ON sr.id = r.request_id
      WHERE sr.provider_id = $1
      `,
      [providerId]
    );

    const s = rows[0];
    res.json({
      totalRequests: Number(s.totalRequests),
      completedRequests: Number(s.completedRequests),
      averageRating: Number(s.averageRating).toFixed(1),
      totalReviews: Number(s.totalReviews)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch provider summary' });
  }
};


exports.getMyRequests = async (req, res) => {
  try {
    const { rows: provRows } = await db.query(
      'SELECT id FROM service_providers WHERE user_id = $1',
      [req.user.id]
    );

    if (!provRows.length) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const providerId = provRows[0].id;

    const { rows } = await db.query(
      `
      SELECT
        sr.id,
        sr.details,
        sr.status,
        sr.created_at,
        u.username AS customer_name,
        u.phone_number AS customer_phone
      FROM service_requests sr
      JOIN users u ON sr.user_id = u.id
      WHERE sr.provider_id = $1
      ORDER BY sr.created_at DESC
      `,
      [providerId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch service requests' });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        sp.id,
        sp.name,
        sp.category,
        sp.phone_number,
        sp.description,
        sp.price,
        sp.location,
        sp.image,
        sp.rating,
        sp.lat,
        sp.lon,
        sp.created_at
      FROM service_providers sp
      WHERE sp.user_id = $1
      `,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: 'Provider profile not found. Please create your profile first.'
      });
    }

    const profile = rows[0];

    if (profile.image) {
      profile.image = `${req.protocol}://${req.get('host')}/uploads/${profile.image}`;
    }

    res.json(profile);
  } catch (err) {
    console.error('Get provider profile error:', err);
    res.status(500).json({ message: 'Could not fetch provider profile' });
  }
};


exports.createProviderProfile = async (req, res) => {
  try {
    const {
      name,
      category,
      phone_number,
      description = null,
      price,
      location = null
    } = req.body;

    const imageFilename = req.file ? req.file.filename : null;

    // Required fields check
    const missing = [];
    if (!name) missing.push('name');
    if (!category) missing.push('category');
    if (!phone_number) missing.push('phone_number');
    if (!price) missing.push('price');
    if (!location) missing.push('location'); // Make location required
    
    if (missing.length) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missing.join(', ')}` 
      });
    }

    // Check if user already has a provider profile
    const { rows: exists } = await db.query(
      'SELECT id FROM service_providers WHERE user_id = $1',
      [req.user.id]
    );
    if (exists.length) {
      return res.status(400).json({ message: 'Profile exists; use update' });
    }

    // Geocode the location
    let lat = null;
    let lon = null;

    try {
      const searchLocation = `${location}, Nairobi, Kenya`;
      console.log('Geocoding location:', searchLocation);
      
      const results = await geocoder.geocode(searchLocation);
      console.log('Geocoding results:', results);

      if (!results || !results.length) {
        return res.status(400).json({
          message: `Could not locate "${location}". Please enter a clearer area name (e.g. "Zimmerman", "Westlands", "Kilimani").`
        });
      }

      lat = results[0].latitude;
      lon = results[0].longitude;

      // Validate coordinates
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        console.error('Invalid coordinates returned:', { lat, lon });
        return res.status(400).json({
          message: 'Invalid coordinates returned. Please try a different location name.'
        });
      }

      console.log('Geocoded coordinates:', { lat, lon });

    } catch (geocodeErr) {
      console.error('Geocoding error:', geocodeErr);
      return res.status(500).json({
        message: 'Location lookup failed. Please try again or use a more specific location (e.g. "Westlands, Nairobi").'
      });
    }

    // Insert provider -  lat/lon  included
    const { rows } = await db.query(
      `
      INSERT INTO service_providers
      (user_id, name, category, phone_number, description,
       price, location, image, lat, lon)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, name, category, lat, lon
      `,
      [
        req.user.id, 
        name, 
        category, 
        phone_number, 
        description, 
        price, 
        location, 
        imageFilename, 
        lat, 
        lon
      ]
    );

    const newProvider = rows[0];
    
    // Verify coordinates were saved
    if (!newProvider.lat || !newProvider.lon) {
      console.error('Coordinates not saved to database:', newProvider);
      return res.status(500).json({
        message: 'Failed to save location coordinates. Please try again.'
      });
    }

    console.log('Provider created successfully:', newProvider);

    res.status(201).json({ 
      message: 'Provider profile created successfully', 
      id: newProvider.id,
      location: {
        lat: newProvider.lat,
        lon: newProvider.lon
      }
    });

  } catch (err) {
    console.error('Create provider profile error:', err);
    res.status(500).json({ 
      message: 'Could not create provider profile', 
      error: err.message 
    });
  }
};

exports.updateProviderProfile = async (req, res) => {
  try {
    const fields = [];
    const values = [];
    let i = 1;

    for (const key of ['name','category','phone_number','description','price','location']) {
      if (req.body[key] !== undefined) {
        fields.push(`${key}=$${i++}`);
        values.push(req.body[key]);
      }
    }

    if (req.file) {
      fields.push(`image=$${i++}`);
      values.push(req.file.filename);
    }

    if (!fields.length) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.user.id);

    await db.query(
      `UPDATE service_providers SET ${fields.join(', ')} WHERE user_id=$${i}`,
      values
    );

    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update provider profile' });
  }
};




exports.getProvidersByCategory = async (req, res) => {
  try {
    const minRating = Number(req.query.minRating) || 0;

    const { rows } = await db.query(
      `
      SELECT
        p.id,
        p.name,
        p.category,
        p.price,
        p.location,
        p.lat,
        p.lon,
        p.image,
        COALESCE(AVG(r.rating), 0) AS rating
      FROM service_providers p
      LEFT JOIN reviews r ON r.provider_id = p.id
      WHERE p.category = $1
        AND p.lat IS NOT NULL
        AND p.lon IS NOT NULL
      GROUP BY p.id
      HAVING COALESCE(AVG(r.rating), 0) >= $2
      ORDER BY rating DESC
      `,
      [req.params.category, minRating]
    );

    res.json({ providers: rows });
  } catch (err) {
    console.error('Get providers by category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
