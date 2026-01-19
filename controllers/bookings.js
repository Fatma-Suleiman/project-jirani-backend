
const db = require('../db');

exports.createBooking = async (req, res) => {
  console.log('*** createBooking called for user', req.user.id, 'body=', req.body);

  const userId      = req.user.id;
  const userName    = req.user.username;
  const userContact = req.user.phone_number || req.user.email;
  const { service_id } = req.body;

  if (!service_id) {
    return res.status(400).json({ message: 'service_id is required' });
  }

  try {
    // Validate service exists in service_providers table
    const [[provider]] = await db.query(
      `SELECT id, name AS service_name, phone_number AS provider_phone
         FROM service_providers
        WHERE id = ?`,
      [service_id]
    );
    if (!provider) {
      return res.status(404).json({ message: `Service not found with id=${service_id}` });
    }
    const providerId = provider.id;

    //  Insert into bookings (seeker history)
    const [bookingResult] = await db.query(
      `INSERT INTO bookings
         (service_id, user_id, user_name, user_contact, booking_date)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [service_id, userId, userName, userContact]
    );

    // Insert into service_requests for provider dashboard
    await db.query(
      `INSERT INTO service_requests
         (booking_id, user_id, provider_id, details, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [
        bookingResult.insertId,
        userId,
        providerId,
        `New booking #${bookingResult.insertId} for service '${provider.service_name}' by ${userName}`
      ]
    );

    console.log(
      '  ➤ bookings.insertId=', bookingResult.insertId,
      '  ➤ providerId=', providerId
    );

    //  Return the new booking to the client
    res.status(201).json({
      id:           bookingResult.insertId,
      service_id,
      user_id:      userId,
      user_name:    userName,
      user_contact: userContact,
      booking_date: new Date().toISOString(),
      status:       'pending'
    });

  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ message: err.message || 'Could not create booking' });
  }
};



exports.cancelBooking = async (req, res) => {
  const bookingId = req.params.id;
  const userId    = req.user.id;  // seeker’s user ID

  try {
    // Verify this booking belongs to the logged-in user
    // only need id and user_id here
    const [[bk]] = await db.query(
      'SELECT id, user_id FROM bookings WHERE id = ?',
      [bookingId]
    );
    if (!bk) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (bk.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Update booking status to 'cancelled'
    await db.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      ['cancelled', bookingId]
    );

    //  mark the linked service_request (by its booking_id)
    await db.query(
      'UPDATE service_requests SET status = ? WHERE booking_id = ?',
      ['cancelled', bookingId]
    );

    return res.json({ message: 'Booking cancelled' });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


//provider
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT
         b.id,
         p.name AS service_name,
         p.phone_number AS provider_phone,
         b.booking_date,
         COALESCE(sr.status, b.status) AS status
       FROM bookings b
       JOIN service_providers p ON b.service_id = p.id
       LEFT JOIN service_requests sr ON b.id = sr.booking_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ message: 'Could not fetch your bookings' });
  }
};



