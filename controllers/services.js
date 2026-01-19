
const db = require('../db');

exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[service]] = await db.query(
      `SELECT 
         s.*, 
         p.name AS provider_name,
         p.phone_number AS provider_phone
       FROM services s
       JOIN service_providers p ON s.provider_id = p.id
       WHERE s.id = ?`,
      [id]
    );

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (err) {
    console.error('Error fetching service:', err);
    res.status(500).json({ message: 'Failed to fetch service' });
  }
};