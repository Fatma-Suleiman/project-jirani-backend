
const db = require('../db');

const Review = {
  // Save a review; expects username, reviewText, and rating
  save: async (username, reviewText, rating) => {
    const sql = 'INSERT INTO reviews (username, review, rating) VALUES (?, ?, ?)';
    const [result] = await db.query(sql, [username, reviewText, rating]);
    return result;
  },
  getAll: async () => {
    const sql = 'SELECT * FROM reviews ORDER BY created_at DESC';
    const [rows] = await db.query(sql);
    return rows;
  }
};

module.exports = Review;
