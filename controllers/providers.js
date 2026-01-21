const db = require('../db');
const multer = require('multer');
const path = require('path');
const NodeGeocoder = require('node-geocoder');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});
exports.upload = multer({ storage });

// Geocoder config
const geocoder = NodeGeocoder({ provider: 'openstreetmap' });

// Get provider profile
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(
      `SELECT id, name, category, phone_number, description, price, location, image,
              rating, lat, lon, created_at
       FROM service_providers
       WHERE user_id = $1`,
      [userId]
    );

    if (!rows.length) return res.status(404).json({ message: 'Provider profile not found' });

    const profile = rows[0];
    if (profile.image) {
      profile.image = `${req.protocol}://${req.get('host')}/uploads/${profile.image}`;
    }

    res.json(profile);
  } catch (err) {
    console.error('Error fetching provider profile:', err.message);
    res.status(500).json({ message: 'Could not fetch provider profile' });
  }
};

// Create provider profile
exports.createProviderProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, category, phone_number, description = null, price, location = null } = req.body;
    const imageFilename = req.file ? req.file.filename : null;

    const missing = [];
    if (!name) missing.push('name');
    if (!category) missing.push('category');
    if (!phone_number) missing.push('phone_number');
    if (!price) missing.push('price');
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(', ')}` });

    const { rows: existingRows } = await db.query(
      'SELECT id FROM service_providers WHERE user_id = $1',
      [userId]
    );
    if (existingRows.length) return res.status(400).json({ message: 'Profile exists; use update' });

    let lat = null, lon = null;
    if (location) {
      const [geo] = await geocoder.geocode(location);
      if (geo) {
        lat = geo.latitude;
        lon = geo.longitude;
      }
    }

    const insertQuery = `
      INSERT INTO service_providers
        (user_id, name, category, phone_number, description, price, location, image, lat, lon)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id
    `;
    const { rows } = await db.query(insertQuery, [userId, name, category, phone_number, description, price, location, imageFilename, lat, lon]);
    const providerId = rows[0].id;

    // Auto-create default service
    await db.query(
      'INSERT INTO services (provider_id, name, price) VALUES ($1, $2, $3)',
      [providerId, 'General Services', 0.00]
    );

    // Return new profile
    const { rows: profileRows } = await db.query(
      'SELECT id, name, category, phone_number, description, price, location, image, rating, lat, lon, created_at FROM service_providers WHERE id = $1',
      [providerId]
    );

    const profile = profileRows[0];
    if (profile.image) {
      profile.image = `${req.protocol}://${req.get('host')}/uploads/${profile.image}`;
    }

    res.status(201).json(profile);
  } catch (err) {
    console.error('Error creating provider profile:', err.message);
    res.status(500).json({ message: 'Could not create provider profile' });
  }
};

// Update provider profile
exports.updateProviderProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, category, phone_number, description, price, location } = req.body;
    const imageFilename = req.file ? req.file.filename : undefined;

    let lat, lon;
    if (location !== undefined) {
      const [geo] = await geocoder.geocode(location);
      lat = geo?.latitude ?? null;
      lon = geo?.longitude ?? null;
    }

    const fields = [];
    const values = [];
    if (name) fields.push('name=$' + (values.push(name)));
    if (category) fields.push('category=$' + (values.push(category)));
    if (phone_number) fields.push('phone_number=$' + (values.push(phone_number)));
    if (description) fields.push('description=$' + (values.push(description)));
    if (price) fields.push('price=$' + (values.push(price)));
    if (location) fields.push('location=$' + (values.push(location)));
    if (lat !== undefined) fields.push('lat=$' + (values.push(lat)));
    if (lon !== undefined) fields.push('lon=$' + (values.push(lon)));
    if (imageFilename !== undefined) fields.push('image=$' + (values.push(imageFilename)));

    if (!fields.length) return res.status(400).json({ message: 'No updatable fields provided' });

    values.push(userId);
    const updateQuery = `UPDATE service_providers SET ${fields.join(', ')} WHERE user_id=$${values.length}`;
    await db.query(updateQuery, values);

    const { rows: profileRows } = await db.query(
      'SELECT id, name, category, phone_number, description, price, location, image, rating, lat, lon, created_at FROM service_providers WHERE user_id=$1',
      [userId]
    );

    const profile = profileRows[0];
    if (profile.image) profile.image = `${req.protocol}://${req.get('host')}/uploads/${profile.image}`;

    res.json(profile);
  } catch (err) {
    console.error('Error updating provider profile:', err.message);
    res.status(500).json({ message: 'Could not update provider profile' });
  }
};

// Get providers by category
exports.getProvidersByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const minRating = Number(req.query.minRating) || 0;

    const { rows } = await db.query(
      `SELECT p.id, p.name, p.category, p.lat, p.lon,
              COALESCE(AVG(r.rating), 0) AS rating
       FROM service_providers p
       LEFT JOIN reviews r ON r.provider_id = p.id
       WHERE p.category=$1
       GROUP BY p.id
       HAVING COALESCE(AVG(r.rating),0) >= $2
       ORDER BY rating DESC`,
      [category, minRating]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching providers by category:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};
