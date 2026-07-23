const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('Missing DATABASE_URL (หรือ POSTGRES_URL) environment variable');
    }
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 1, // สำคัญ: จำกัด connection ต่อ serverless function instance กัน connection ล้น
    });
  }
  return pool;
}

module.exports = { getPool };
