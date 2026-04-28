import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(url);

try {
  console.log('Applying migration 0018...');
  await conn.execute("ALTER TABLE `jobs` MODIFY COLUMN `status` enum('ingested','matched','to_apply','blocked','applied','nextsteps','rejected','expired') NOT NULL DEFAULT 'ingested'");
  console.log('  ✓ Status enum updated');
  await conn.execute("ALTER TABLE `jobs` ADD COLUMN `nextStepNote` varchar(512)");
  console.log('  ✓ nextStepNote column added');
  console.log('Migration 0018 complete!');
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') {
    console.log('  ⚠ nextStepNote column already exists, skipping');
  } else {
    console.error('Migration error:', e.message);
    process.exit(1);
  }
} finally {
  await conn.end();
}
