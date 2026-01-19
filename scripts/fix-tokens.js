require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

//  direct connection pool with proper encoding
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // properly handles special characters
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

async function fixNullTokens() {
  let connection;
  try {
    // Test connection first
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS test');
    console.log('Database connection successful. Test result:', rows[0].test);

    // Get users with null tokens
    // In fix-tokens.js
    const [users] = await connection.query(`
        SELECT id, username, email 
        FROM users 
        WHERE token = 'TEMPORARY_PLACEHOLDER' 
           OR token IS NULL
      `);
      
      console.log(`Found ${users.length} users with invalid tokens (NULL or placeholder)`);

    // Update each user
    for (const user of users) {
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '90d' }
      );

      await connection.query(
        'UPDATE users SET token = ? WHERE id = ?',
        [token, user.id]
      );
      
      console.log(`Updated token for user ${user.id}`);
    }

    console.log('✅ All null tokens fixed!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) connection.release();
    await pool.end();
    process.exit();
  }
}

fixNullTokens();