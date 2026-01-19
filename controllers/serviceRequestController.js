const db = require('../db');

//provider
exports.getCompletedRequests = async (req, res) => {
  try {
    // find provider profile
    const [provRows] = await db.query(
      'SELECT id FROM service_providers WHERE user_id = ?',
      [req.user.id]
    );
    if (!provRows.length) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }
    const providerId = provRows[0].id;

    // fetch only completed for this provider
    const [rows] = await db.query(
      `SELECT
         sr.id,
         sr.details,
         sr.scheduled_date,
         sr.created_at AS completed_at,
         u.username     AS customer_name,
         u.phone_number AS customer_phone
       FROM service_requests sr
       JOIN users u ON sr.user_id = u.id
       WHERE sr.provider_id = ?
         AND sr.status = 'completed'
       ORDER BY sr.created_at DESC`,
      [providerId]
    );
    return res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching completed requests:', err);
    return res.status(500).json({ message: 'Could not fetch completed requests' });
  }
};


exports.getCompletedForSeeker = async (req, res) => {
  try {
    const seekerId = req.user.id;
    const [rows] = await db.query(
      `SELECT id, details, created_at
       FROM service_requests
       WHERE status  = 'completed'
         AND user_id = ?
       ORDER BY created_at DESC`,
      [seekerId]
    );
    console.log('   rows:', rows);
    return res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching seeker completed requests:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.updateRequestStatus = async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  try {
    // verify provider owns the request
    const [[prov]] = await db.query(
      'SELECT id FROM service_providers WHERE user_id = ?',
      [req.user.id]
    );
    if (!prov) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // grab linked booking_id
    const [[reqRow]] = await db.query(
      'SELECT booking_id FROM service_requests WHERE id = ? AND provider_id = ?',
      [id, prov.id]
    );
    if (!reqRow?.booking_id) {
      return res.status(404).json({ message: 'Linked booking not found' });
    }

    // update both tables
    await db.query(
      'UPDATE service_requests SET status = ? WHERE id = ? AND provider_id = ?',
      [status, id, prov.id]
    );
    await db.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, reqRow.booking_id]
    );

    return res.json({ message: 'Status updated', id, status });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ message: 'Server error updating status' });
  }
};
