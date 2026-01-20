const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.test' });

const db = require('../../db/connect');

async function resetDatabase() {
  const sqlPath = path.join(__dirname, 'reset.all.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  await db.query(sql);
}

module.exports = {
  db,
  resetDatabase,
};