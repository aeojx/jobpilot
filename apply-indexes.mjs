import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);

const statements = [
  "CREATE INDEX idx_jobs_status ON jobs(status)",
  "CREATE INDEX idx_jobs_status_score ON jobs(status, matchScore, createdAt)",
  "CREATE INDEX idx_jobs_match_score ON jobs(matchScore)",
];

for (const sql of statements) {
  try {
    await conn.execute(sql);
    console.log('✓ Applied:', sql.substring(0, 60));
  } catch (err) {
    if (err.code === 'ER_DUP_KEYNAME' || err.message?.includes('Duplicate key name') || err.message?.includes('already exists')) {
      console.log('⚠ Already exists (skip):', sql.substring(0, 60));
    } else {
      console.error('✗ Failed:', sql.substring(0, 60), '\n  Error:', err.message);
    }
  }
}

// Verify indexes were created
const [indexRows] = await conn.execute('SHOW INDEX FROM jobs');
console.log('\nCurrent indexes on jobs table:');
indexRows.forEach(r => console.log(' -', r.Key_name, '|', r.Column_name, '| Non_unique:', r.Non_unique));

await conn.end();
