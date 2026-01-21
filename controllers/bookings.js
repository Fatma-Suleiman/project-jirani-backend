const db = require('../db');

// Create a booking
exports.createBooking = async (req, res) => {
  const userId = req.user.id;
  const userName = req.user.username;
  const userContact = req.user.phone_number || req.user.email;
  const { service_id } = req.body;

  if (!service_id) return res.status(400).json({ message: 'service_id is required' });

  try {
    // Validate service exists
    const { rows: providerRows } = await db.query(
      'SELECT id, name AS service_name FROM service_providers WHERE id=$1',
      [service_id]
    );

    if (!providerRows.length) return res.status(404).json({ message: `Service not found with id=${service_id}` });
    const providerId = providerRows[0].id;

    // Insert into bookings
    const { rows: bookingRows } = await db.query(
      `INSERT INTO bookings (service_id, user_id, user_name, user_contact, booking_date)
       VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP)
       RETURNING id`,
      [service_id, userId, userName, userContact]
    );

    const bookingId = bookingRows[0].id;

    // Insert into service_requests for provider dashboard
    await db.query(
      `INSERT INTO service_requests (booking_id, user_id, provider_id, details, status)
       VALUES ($1,$2,$3,$4,'pending')`,
      [bookingId, userId, providerId, `New booking #${bookingId} for service '${providerRows[0].service_name}' by ${userName}`]
    );

    res.status(201).json({
      id: bookingId,
      service_id,
      user_id: userId,
      user_name: userName,
      user_contact: userContact,
      booking_date: new Date().toISOString(),
      status: 'pending'
    });
  } catch (err) {
    console.error('Error creating booking:', err.message);
    res.status(500).json({ message: 'Could not create booking' });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;

  try {
    const { rows } = await db.query('SELECT id, user_id FROM bookings WHERE id=$1', [bookingId]);
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' });
    if (rows[0].user_id !== userId) return res.status(403).json({ message: 'Not authorized to cancel this booking' });

    await db.query('UPDATE bookings SET status=$1 WHERE id=$2', ['cancelled', bookingId]);
    await db.query('UPDATE service_requests SET status=$1 WHERE booking_id=$2', ['cancelled', bookingId]);

    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    console.error('Error cancelling booking:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user bookings (seeker)
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(
      `SELECT b.id, p.name AS service_name, p.phone_number AS provider_phone,
              b.booking_date, COALESCE(sr.status, b.status) AS status
       FROM bookings b
       JOIN service_providers p ON b.service_id = p.id
       LEFT JOIN service_requests sr ON b.id = sr.booking_id
       WHERE b.user_id=$1
       ORDER BY b.booking_date DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching user bookings:', err.message);
    res.status(500).json({ message: 'Could not fetch your bookings' });
  }
};
