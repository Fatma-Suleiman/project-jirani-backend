const db = require('../db');

function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.getCategories = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT DISTINCT category FROM service_providers ORDER BY category'
    );

    res.json(result.rows.map(c => c.category));
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

exports.getAllServices = async (req, res) => {
  const { category, lat, long, radius } = req.query;

  try {
    let sql = 'SELECT * FROM service_providers';
    const params = [];

    if (category) {
      sql += ' WHERE LOWER(category) = LOWER($1)';
      params.push(category);
    }

    const result = await db.query(sql, params);
    const services = result.rows;

    const formattedServices = services.map(s => {
      let imageUrl = null;
      if (s.image) {
        if (s.image.startsWith('/images/') || s.image.startsWith('http')) {
          imageUrl = s.image; // Seeded data
        } else {
          imageUrl = `${req.protocol}://${req.get('host')}/uploads/${s.image}`; // Uploaded
        }
      }

      return {
        id: s.id,
        name: s.name,
        description: s.description || '',
        price: s.price,
        rating: s.rating !== null ? Number(s.rating) : 0,
        phone_number: s.phone_number,
        image: imageUrl,
        location: s.location,
        lat: s.lat,
        lon: s.lon
      };
    });

    if (lat && long) {
      const uLat = parseFloat(lat);
      const uLon = parseFloat(long);
      const r = radius ? parseFloat(radius) : 10;

      const withDistance = formattedServices
        .map(s => ({
          ...s,
          distance: calculateDistance(
            uLat,
            uLon,
            parseFloat(s.lat),
            parseFloat(s.lon)
          )
        }))
        .filter(s => !isNaN(s.distance) && s.distance <= r)
        .sort((a, b) => a.distance - b.distance);

      return res.json(withDistance);
    }

    res.json(formattedServices);
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ message: 'Error fetching services' });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM service_providers WHERE id = $1',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const prov = result.rows[0];

    let imageUrl = null;
    if (prov.image) {
      if (prov.image.startsWith('/images/') || prov.image.startsWith('http')) {
        imageUrl = prov.image; // Seeded data
      } else {
        imageUrl = `${req.protocol}://${req.get('host')}/uploads/${prov.image}`; // Uploaded
      }
    }

    res.json({
      id: prov.id,
      name: prov.name,
      description: prov.description || '',
      price: prov.price,
      rating: prov.rating !== null ? Number(prov.rating) : 0,
      phone_number: prov.phone_number,
      image: imageUrl,
      location: prov.location,
      lat: prov.lat,
      lon: prov.lon
    });
  } catch (err) {
    console.error('Error fetching service:', err);
    res.status(500).json({ message: 'Failed to fetch service' });
  }
};