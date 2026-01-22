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
      SELECT id, name, category, phone_number, description, price,
             location, image, rating, lat, lon, created_at
      FROM service_providers
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const profile = rows[0];
    if (profile.image) {
      profile.image = `${req.protocol}://${req.get('host')}/uploads/${profile.image}`;
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
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

    // Multer file
    const imageFilename = req.file ? req.file.filename : null;

    // Required fields check
    const missing = [];
    if (!name) missing.push('name');
    if (!category) missing.push('category');
    if (!phone_number) missing.push('phone_number');
    if (!price) missing.push('price');
    if (missing.length) {
      return res.status(400).json({ message: `Missing required: ${missing.join(', ')}` });
    }

    // Check if user already has a provider profile
    const { rows: exists } = await db.query(
      'SELECT id FROM service_providers WHERE user_id = $1',
      [req.user.id]
    );
    if (exists.length) {
      return res.status(400).json({ message: 'Profile exists; use update' });
    }

    // Optional geocoding
    let lat = null, lon = null;
    if (location) {
      try {
        const [geo] = await geocoder.geocode(location);
        if (geo) {
          lat = geo.latitude;
          lon = geo.longitude;
        }
      } catch (err) {
        console.warn('Geocoding failed:', err.message);
      }
    }

    // Insert provider
    const { rows } = await db.query(
      `
      INSERT INTO service_providers
      (user_id, name, category, phone_number, description,
       price, location, image, lat, lon)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, name, category
      `,
      [req.user.id, name, category, phone_number, description, price, location, imageFilename, lat, lon]
    );

    const providerId = rows[0].id;

    res.status(201).json({ message: 'Provider profile created', id: providerId });
  } catch (err) {
    console.error('Create provider profile error:', err);
    res.status(500).json({ message: 'Could not create provider profile', error: err.message });
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
    const { rows } = await db.query(
      `
      SELECT
        p.id, p.name, p.lat, p.lon,
        COALESCE(AVG(r.rating),0) AS rating
      FROM service_providers p
      LEFT JOIN reviews r ON r.provider_id = p.id
      WHERE p.category = $1
      GROUP BY p.id
      HAVING COALESCE(AVG(r.rating),0) >= $2
      ORDER BY rating DESC
      `,
      [req.params.category, Number(req.query.minRating) || 0]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
