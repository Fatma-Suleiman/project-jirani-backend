
const db = require('../db');

// Helper: Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.getCategories = async (req, res) => {
  try {
    const [cats] = await db.query(
      'SELECT DISTINCT category FROM service_providers'
    );
    res.json(cats.map(c => c.category));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

exports.getAllServices = async (req, res) => {
  const { category, lat, long, radius } = req.query;
  try {
    let sql = 'SELECT * FROM service_providers';
    const params = [];

    if (category) {
      sql += ' WHERE LOWER(category) = ?';
      params.push(category.toLowerCase());
    }

    const [services] = await db.query(sql, params);

    // Format services with proper image paths
    const formattedServices = services.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description || '',
      price: s.price,
      rating: s.rating != null ? Number(s.rating) : 0,
      phone_number: s.phone_number,
      image: s.image ? 
        (s.image.startsWith('/images/') 
          ? s.image  // Frontend handles public images
          : `/uploads/${s.image}`)  // Proxy handles uploads
        : null,
      location: s.location,
      lat: s.lat,
      lon: s.lon
    }));

    if (lat && long) {
      const uLat = parseFloat(lat);
      const uLon = parseFloat(long);
      const r = radius ? parseFloat(radius) : 10;

      const withDist = formattedServices
        .map(s => ({
          ...s,
          distance: calculateDistance(uLat, uLon, parseFloat(s.lat), parseFloat(s.lon))
        }))
        .filter(s => s.distance <= r)
        .sort((a, b) => a.distance - b.distance);

      return res.json(withDist);
    }

    res.json(formattedServices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching services' });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[prov]] = await db.query(
      'SELECT * FROM service_providers WHERE id = ?', [id]
    );

    if (!prov) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({
      id: prov.id,
      name: prov.name,
      description: prov.description || '',
      price: prov.price,
      rating: prov.rating != null ? Number(prov.rating) : 0,
      phone_number: prov.phone_number,
      image: prov.image ? 
        (prov.image.startsWith('/images/') 
          ? prov.image  // Frontend handles public images
          : `/uploads/${prov.image}` ) // Proxy handles uploads
        : null,
      location: prov.location
    });

  } catch (err) {
    console.error('Error fetching service:', err);
    res.status(500).json({ message: 'Failed to fetch service' });
  }
};