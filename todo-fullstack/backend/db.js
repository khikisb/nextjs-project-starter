const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'todoapp',
  password: 'yourpassword',
  port: 5432,
});

module.exports = pool;
