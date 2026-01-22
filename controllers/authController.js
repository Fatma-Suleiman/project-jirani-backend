const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "90d" });

exports.register = async (req, res) => {
  const { username, email, password, phone_number } = req.body;
  if (!username || !email || !password || !phone_number)
    return res.status(400).json({ message: "All fields are required" });
  try {
    const { rows: existing } = await db.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    if (existing.length)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (username, email, password, phone_number)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, phone_number
    `;
    const { rows } = await db.query(insertQuery, [
      username,
      email.toLowerCase(),
      hashedPassword,
      phone_number
    ]);

    const token = generateToken(rows[0].id);
    await db.query("UPDATE users SET token = $1 WHERE id = $2", [token, rows[0].id]);
    res.status(201).json({ token, user: rows[0] });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Please provide both email and password" });
  try {
    const { rows } = await db.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    if (!rows.length)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user.id);
    await db.query("UPDATE users SET token = $1 WHERE id = $2", [token, user.id]);

    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.getProfile = async (req, res) => {
  try {
    // Make sure the user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Fetch user info only
    const { rows: userRows } = await db.query(
      `SELECT id, username, email, phone_number
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (!userRows.length) return res.status(404).json({ message: "User not found" });

    const user = userRows[0];

    // Return only user info — bookings will be fetched separately
    res.status(200).json({ user });
  } catch (err) {
    console.error("Profile Error:", err);
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};




exports.updateProfile = async (req, res) => {
  const { username, email, phone_number } = req.body;
  if (!phone_number) return res.status(400).json({ message: "Phone number is required" });
  try {
    const { rows: emailCheck } = await db.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2",
      [email, req.user.id]
    );
    if (emailCheck.length) return res.status(400).json({ message: "Email already in use" });

    const { rows: usernameCheck } = await db.query(
      "SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2",
      [username, req.user.id]
    );
    if (usernameCheck.length) return res.status(400).json({ message: "Username already in use" });

    await db.query(
      "UPDATE users SET username = $1, email = $2, phone_number = $3 WHERE id = $4",
      [username, email.toLowerCase(), phone_number, req.user.id]
    );

    res.json({ success: true, user: { id: req.user.id, username, email: email.toLowerCase(), phone_number } });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) token = authHeader.split(" ")[1].trim();
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [decoded.id]);
    if (!rows.length || rows[0].token !== token) return res.status(401).json({ message: "Session invalid or expired" });

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") return res.status(401).json({ message: "Invalid token" });
    if (err.name === "TokenExpiredError") return res.status(401).json({ message: "Session expired — please log in again" });
    console.error("[AUTH] Unexpected error:", err);
    res.status(500).json({ message: "Server error during authentication" });
  }
};
