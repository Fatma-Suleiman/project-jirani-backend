const db = require('../db');
const multer = require('multer');
const path = require('path');
const NodeGeocoder = require('node-geocoder');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});
exports.upload = multer({ storage });

// Geocoder config
const geocoder = NodeGeocoder({ provider: 'openstreetmap' });

exports.getMySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    // fetch provider id
    const [[prov]] = await db.query(
      'SELECT id FROM service_providers WHERE user_id = ?',
      [userId]
    );
    if (!prov) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    //  aggregate stats
    const [[summary]] = await db.query(
      `SELECT
         COUNT(*)                           AS totalRequests,
         SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completedRequests,
         AVG(r.rating)                      AS averageRating,
         COUNT(DISTINCT r.id)               AS totalReviews
       FROM service_requests sr
       LEFT JOIN reviews r
         ON sr.id = r.request_id
       WHERE sr.provider_id = ?`,
      [prov.id]
    );

    res.json({
      totalRequests:    summary.totalRequests    || 0,
      completedRequests:summary.completedRequests|| 0,
      averageRating:    summary.averageRating    ? Number(summary.averageRating).toFixed(1) : '0.0',
      totalReviews:     summary.totalReviews     || 0
    });
  } catch (err) {
    console.error('Error fetching provider summary:', err);
    res.status(500).json({ message: 'Could not fetch provider summary' });
  }
};



exports.getMyRequests = async (req, res) => {
  try {
    //  find provider’s internal ID
    const [provRows] = await db.query(
      'SELECT id FROM service_providers WHERE user_id = ?',
      [req.user.id]
    );
    if (!provRows.length) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }
    const providerId = provRows[0].id;

    // fetch all service_requests for that provider
    const [requests] = await db.query(
      `SELECT
         sr.id,
         sr.details,
         sr.status,
         sr.created_at,
         u.username     AS customer_name,
         u.phone_number AS customer_phone
       FROM service_requests sr
       JOIN users u ON sr.user_id = u.id
       WHERE sr.provider_id = ?
       ORDER BY sr.created_at DESC`,
      [providerId]
    );
    res.json(requests);


  } catch (err) {
    console.error('Error fetching service requests:', err);
    res.status(500).json({ message: 'Could not fetch service requests' });
  }
};


exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT id, name, category, phone_number, description, price, location, image,
              rating, lat, lon, created_at
       FROM service_providers
       WHERE user_id = ?`,
      [userId]
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
    console.error('Error fetching provider profile:', err);
    res.status(500).json({ message: 'Could not fetch provider profile' });
  }
};


exports.createProviderProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      category,
      phone_number,
      description = null,
      price,
      location = null
    } = req.body;

    // actual variable
    const imageFilename = req.file ? req.file.filename : null;

    // required fields
    const missing = [];
    if (!name)          missing.push('name');
    if (!category)      missing.push('category');
    if (!phone_number)  missing.push('phone_number');
    if (!price)         missing.push('price');
    if (missing.length) {
      return res.status(400).json({ message: `Missing: ${missing.join(', ')}` });
    }

    // prevent duplicate
    const [[existing]] = await db.query(
      'SELECT id FROM service_providers WHERE user_id = ?',
      [userId]
    );
    if (existing) {
      return res.status(400).json({ message: 'Profile exists; use update' });
    }

    // geocode if needed
    let lat = null, lon = null;
    if (location) {
      const [geo] = await geocoder.geocode(location);
      if (geo) {
        lat = geo.latitude;
        lon = geo.longitude;
      }
    }

    // ** imageFilename here** instead of undefined `image`
    const [insertResult] = await db.query(
      `INSERT INTO service_providers
         (user_id, name, category, phone_number, description, price, location, image, lat, lon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, category, phone_number, description, price, location, imageFilename, lat, lon]
    );
    const providerId = insertResult.insertId;

    // auto-create default service
    await db.query(
      `INSERT INTO services (provider_id, name, price)
         VALUES (?, ?, ?)`,
      [providerId, 'General Services', 0.00]
    );

    // fetch & return the new row
    const [[row]] = await db.query(
      `SELECT id, name, category, phone_number, description, price, location, image,
              rating, lat, lon, created_at
       FROM service_providers
       WHERE id = ?`,
      [providerId]
    );
    if (row.image) {
      row.image = `${req.protocol}://${req.get('host')}/uploads/${row.image}`;
    }

    res.status(201).json(row);
  } catch (err) {
    console.error('Error creating provider profile:', err);
    res.status(500).json({ message: 'Could not create provider profile' });
  }
};

/*PUT /api/providers/me*/
exports.updateProviderProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      category,
      phone_number,
      description,
      price,
      location
    } = req.body;

    // capture new upload, if any
    const imageFilename = req.file ? req.file.filename : undefined;

    // geocode if location changed
    let lat, lon;
    if (location !== undefined) {
      const [geo] = await geocoder.geocode(location);
      lat = geo?.latitude ?? null;
      lon = geo?.longitude ?? null;
    }

    // build dynamic SET
    const fields = [];
    const values = [];
    if (name)          { fields.push('name = ?');         values.push(name); }
    if (category)      { fields.push('category = ?');     values.push(category); }
    if (phone_number)  { fields.push('phone_number = ?'); values.push(phone_number); }
    if (description)   { fields.push('description = ?');  values.push(description); }
    if (price)         { fields.push('price = ?');        values.push(price); }
    if (location)      { fields.push('location = ?');     values.push(location); }
    if (lat !== undefined) { fields.push('lat = ?');      values.push(lat); }
    if (lon !== undefined) { fields.push('lon = ?');      values.push(lon); }
    if (imageFilename !== undefined) {
      fields.push('image = ?');
      values.push(imageFilename);
    }

    if (!fields.length) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }

    values.push(userId);
    await db.query(
      `UPDATE service_providers
         SET ${fields.join(', ')}
       WHERE user_id = ?`,
      values
    );

    // fetch & return updated
    const [[row]] = await db.query(
      `SELECT id, name, category, phone_number, description, price, location, image,
              rating, lat, lon, created_at
       FROM service_providers
       WHERE user_id = ?`,
      [userId]
    );
    if (row.image) {
      row.image = `${req.protocol}://${req.get('host')}/uploads/${row.image}`;
    }

    res.json(row);
  } catch (err) {
    console.error('Error updating provider profile:', err);
    res.status(500).json({ message: 'Could not update provider profile' });
  }
};



exports.getProvidersByCategory = async (req, res) => {
  const { category } = req.params;
  const minRating = Number(req.query.minRating) || 0;

  const sql = `
    SELECT 
      p.id, p.name, p.address, p.latitude AS lat, p.longitude AS lon,
      COALESCE(AVG(r.rating), 0) AS rating
    FROM providers p
    LEFT JOIN reviews r ON r.provider_id = p.id
    WHERE p.category = ?
    GROUP BY p.id
    HAVING rating >= ?
    ORDER BY rating DESC
  `;
  try {
    const [rows] = await db.query(sql, [category, minRating]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};
