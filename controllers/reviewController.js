const db = require('../db');

// Create review
exports.createReview = async (req, res) => {
  const userId = req.user.id;
  const { request_id, review, rating } = req.body;

  if (!request_id || !review || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Missing or invalid fields.' });
  }

  try {
    const { rows: reqRows } = await db.query('SELECT provider_id FROM service_requests WHERE id=$1', [request_id]);
    if (!reqRows.length) return res.status(404).json({ message: 'Service request not found.' });

    const providerId = reqRows[0].provider_id;

    await db.query(
      'INSERT INTO reviews (user_id, request_id, provider_id, review, rating) VALUES ($1,$2,$3,$4,$5)',
      [userId, request_id, providerId, review, rating]
    );

    res.status(201).json({ message: 'Review submitted successfully.' });
  } catch (err) {
    console.error('Error saving review:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.id, u.username, sr.details AS service_details, r.review, r.rating, r.created_at
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN service_requests sr ON r.request_id = sr.id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching all reviews:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get provider-specific reviews
exports.getProviderReviews = async (req, res) => {
  const providerId = req.user.id;
  try {
    const { rows } = await db.query(
      `SELECT r.id, u.username, sr.details AS service_details, r.review, r.rating, r.created_at
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN service_requests sr ON r.request_id = sr.id
       WHERE r.provider_id=$1
       ORDER BY r.created_at DESC`,
      [providerId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching provider reviews:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};
