require('dotenv').config();

const { Pool } = require('pg');
const mysql = require('mysql2');

const isProduction = !!process.env.DATABASE_URL;

let pool;

if (isProduction) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Using PostgreSQL (Production)');

  module.exports = {
    query: (sql, params = []) => {
      // Convert ? to $1, $2, ...
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);
      return pool.query(pgSql, params);
    }
  };

} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: 'Z',
    connectionLimit: 10,
    multipleStatements: true,
    charset: 'utf8mb4'
  }).promise();

  console.log('Using MySQL (Local Development)');

  module.exports = pool;
}
