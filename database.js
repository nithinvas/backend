const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  // host: 'sql12.freemysqlhosting.net',
  // user: 'sql12671367',
  // password: 'FALmVB8MIz',
  // database: 'sql12671367',


  // host: 'localhost',
  // user: 'root',
  // password: 'Nithinvas@321',
  // database: 'flex',


  host     : 'byvxa4jsdpmrvyhnlyfz-mysql.services.clever-cloud.com',
  user     : 'uhhb1q8xdjof83er',
  password : 'EHB9Q5q1xdHUaLf06UHs',
  database : 'byvxa4jsdpmrvyhnlyfz',
  port     : '3306'
});

 


const queryAsync = async (sql, values) => {
  try {
    const [rows, fields] = await pool.execute(sql, values);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  queryAsync,
};








