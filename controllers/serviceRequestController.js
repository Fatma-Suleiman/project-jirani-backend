
const db = require('../db');

// Provider: Get completed requests
exports.getCompletedRequests = async (req, res) => {
  try {
    const { rows: provRows } = await db.query('SELECT id FROM service_providers WHERE user_id=$1', [req.user.id]);
    if (!provRows.length) return res.status(404).json({ message: 'Provider profile not found' });

    const providerId = provRows[0].id;

    const { rows } = await db.query(
      `SELECT sr.id, sr.details, sr.scheduled_date, sr.created_at AS completed_at,
              u.username AS customer_name, u.phone_number AS customer_phone
       FROM service_requests sr
       JOIN users u ON sr.user_id=u.id
       WHERE sr.provider_id=$1 AND sr.status='completed'
       ORDER BY sr.created_at DESC`,
      [providerId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching completed requests:', err.message);
    res.status(500).json({ message: 'Could not fetch completed requests' });
  }
};

// Seeker: Get completed requests
exports.getCompletedForSeeker = async (req, res) => {
  try {
    const seekerId = req.user.id;
    const { rows } = await db.query(
      `SELECT id, details, created_at
       FROM service_requests
       WHERE status='completed' AND user_id=$1
       ORDER BY created_at DESC`,
      [seekerId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching seeker completed requests:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update request status (provider)
exports.updateRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { rows: provRows } = await db.query('SELECT id FROM service_providers WHERE user_id=$1', [req.user.id]);
    if (!provRows.length) return res.status(404).json({ message: 'Provider profile not found' });

    const providerId = provRows[0].id;

    const { rows: reqRows } = await db.query('SELECT booking_id FROM service_requests WHERE id=$1 AND provider_id=$2', [id, providerId]);
    if (!reqRows.length || !reqRows[0].booking_id) return res.status(404).json({ message: 'Linked booking not found' });

    await db.query('UPDATE service_requests SET status=$1 WHERE id=$2 AND provider_id=$3', [status, id, providerId]);
    await db.query('UPDATE bookings SET status=$1 WHERE id=$2', [status, reqRows[0].booking_id]);

    res.json({ message: 'Status updated', id, status });
  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).json({ message: 'Server error updating status' });
  }
};
