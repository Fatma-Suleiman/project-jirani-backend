const db = require('../db');
const bcrypt = require('bcryptjs');

const User = {
  // Create a new user and hash the password
  create: async (username, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    const [result] = await db.query(sql, [username, email, hashedPassword]);
    return result;
  },

  // Find a user by email
  findByEmail: async (email) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await db.query(sql, [email]);
    return rows[0];
  },

  // Update user profile
  updateProfile: async (userId, username, email) => {
    const sql = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
    const [result] = await db.query(sql, [username, email, userId]);
    return result;
  },

  // Get user by id
  findById: async (userId) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await db.query(sql, [userId]);
    return rows[0];
  }
};

module.exports = User;




