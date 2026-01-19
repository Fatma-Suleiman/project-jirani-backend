const db = require('../db');

exports.createReview = async (req, res) => {
  const userId = req.user.id;           // authenticated user
  const { request_id, review, rating } = req.body;

  if (!request_id || !review || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Missing or invalid fields.' });
  }
  try {
    // find provider for this request
    const [reqRows] = await db.query(
      'SELECT provider_id FROM service_requests WHERE id = ?',
      [request_id]
    );
    if (reqRows.length === 0) {
      return res.status(404).json({ message: 'Service request not found.' });
    }
    const providerId = reqRows[0].provider_id;

    // insert review
    const sql = `
      INSERT INTO reviews
        (user_id, request_id, provider_id, review, rating)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(sql, [userId, request_id, providerId, review, rating]);
    res.status(201).json({ message: 'Review submitted successfully.' });
  } catch (err) {
    console.error('Error saving review:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const sql = `
      SELECT r.id,
             u.username,
             sr.details AS service_details,
             r.review,
             r.rating,
             r.created_at
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN service_requests sr ON r.request_id = sr.id
      ORDER BY r.created_at DESC
    `;
    const [rows] = await db.query(sql);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching all reviews:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getProviderReviews = async (req, res) => {
  const providerId = req.user.id;
  try {
    const sql = `
      SELECT r.id,
             u.username,
             sr.details AS service_details,
             r.review,
             r.rating,
             r.created_at
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN service_requests sr ON r.request_id = sr.id
      WHERE r.provider_id = ?
      ORDER BY r.created_at DESC
    `;
    const [rows] = await db.query(sql, [providerId]);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching provider reviews:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
