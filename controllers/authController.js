const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Register user
exports.register = async (req, res) => {
  const { username, email, password, phone_number } = req.body;

  // All fields required
  if (!username || !email || !password || !phone_number) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if email already exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE LOWER(email)=LOWER(?)',
      [email]
    );
    if (existing.length) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate token now
    const token = jwt.sign(
      { id: null, username, email },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );

    // Insert everything _including_ token
    const [result] = await db.query(
      `INSERT INTO users
         (username, email, password, phone_number, token)
       VALUES (?, ?, ?, ?, ?)`,          // ← comma added here
      [username, email.toLowerCase(), hashedPassword, phone_number, token]
    );

    // Re-sign token with real id, then update:
    const realToken = jwt.sign(
      { id: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );
    await db.query(
      'UPDATE users SET token = ? WHERE id = ?',
      [realToken, result.insertId]
    );

    // Return the fresh user & token
    res.status(201).json({
      token: realToken,
      user: {
        id:           result.insertId,
        username,
        email:        email.toLowerCase(),
        phone_number
      }
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    //  Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide both email and password'
      });
    }

    //  Check user existence (case-insensitive)
    const [users] = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)', 
      [email]
    );
    
    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials' // Generic message for security
      });
    }
    const user = users[0];

    //  Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    //  JWT_SECRET check
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET missing in environment');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    //  Generate token
    const token = jwt.sign(
      { id: user.id },  // Minimal payload for security
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );

    //  Update token in database
    await db.query(
      'UPDATE users SET token = ? WHERE id = ?',
      [token, user.id]
    );

    //  Successful response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error); // Log full error
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user profile along with booking history
exports.getProfile = async (req, res) => {
  try {
    const [userRows] = await db.query(
      `SELECT id, username, email, phone_number
         FROM users
         WHERE id = ?`,
      [req.user.id]
    );
    if (!userRows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userRows[0];

    const [bookings] = await db.query(
      `SELECT
         b.id,
         sp.category    AS service_name,
         sp.name        AS provider_name,
         DATE(b.booking_date) AS date,
         TIME(b.booking_date) AS time,
         b.status,
         b.user_contact
       FROM bookings b
       JOIN service_providers sp 
         ON b.service_id = sp.id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [req.user.id]
    );

    res.status(200).json({
      user,
      bookings: bookings || []
    });
  } catch (err) {
    console.error('Profile Error:', err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// Update user profile (username + email + phone_number)
exports.updateProfile = async (req, res) => {
  const { username, email, phone_number } = req.body;

  // Phone  always required on update
  if (!phone_number) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {

    //uniqueness check for email and username
  
    const [emailCheck] = await db.query(
      'SELECT id FROM users WHERE LOWER(email)=LOWER(?) AND id != ?',
      [email, req.user.id]
    );
    if (emailCheck.length) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    
    const [usernameCheck] = await db.query(
      'SELECT id FROM users WHERE LOWER(username)=LOWER(?) AND id != ?',
      [username, req.user.id]
    );
    if (usernameCheck.length) {
      return res.status(400).json({ message: 'Username already in use' });
    }

    // update all three fields
    await db.query(
      `UPDATE users
         SET username     = ?,
             email        = ?,
             phone_number = ?
       WHERE id = ?`,
      [username, email.toLowerCase(), phone_number || null, req.user.id]
    );

    // respond with fresh user object
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username,
        email: email.toLowerCase(),
        phone_number: phone_number || null
      }
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Updated protect middleware
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1].trim();
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Optional: only log in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('[AUTH] Verifying token:', token.substring(0, 15) + '…');
    }

    // Ensure token contains provider ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optional: dev logging
    if (process.env.NODE_ENV === 'development') {
      console.debug('[AUTH] Token decoded, user ID =', decoded.id);
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!users.length || users[0].token !== token) {
      return res.status(401).json({ message: 'Session invalid or expired' });
    }

    req.user = users[0];
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired — please log in again' });
    }
    console.error('[AUTH] Unexpected error:', err);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};
