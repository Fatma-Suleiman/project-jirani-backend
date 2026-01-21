require('dotenv').config({ path: './.env' });

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

let pool;

if (isProduction) {

  const { Pool } = require('pg');
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log('Using PostgreSQL (Production)');


  const query = async (sql, params) => {
    try {

      let pgSql = sql;
      let pgParams = params;
      
      if (params && params.length > 0) {
        let paramIndex = 1;
        pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        pgParams = params;
      }
      
      const result = await pool.query(pgSql, pgParams);

      return [result.rows, result.fields];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  };

  pool.query = query;

} else {

  const mysql = require('mysql2');
  
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
}


(async () => {
  try {
    const [result] = await pool.query('SELECT 1 + 1 AS solution');
    console.log('Database connected! Test query result:', result);
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
})();

module.exports = pool;