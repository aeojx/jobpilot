import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [countRows] = await conn.execute('SELECT COUNT(*) as total FROM jobs');
console.log('Total jobs:', countRows[0].total);
const [explainRows] = await conn.execute("EXPLAIN SELECT * FROM jobs ORDER BY matchScore DESC, createdAt DESC");
console.log('\nEXPLAIN kanban query:');
console.log(JSON.stringify(explainRows, null, 2));
const [explainRows2] = await conn.execute("EXPLAIN SELECT * FROM jobs WHERE status = 'matched' ORDER BY matchScore DESC, createdAt DESC");
console.log('\nEXPLAIN byStatus query:');
console.log(JSON.stringify(explainRows2, null, 2));
// Check description column sizes
const [descRows] = await conn.execute("SELECT id, LENGTH(description) as desc_len, LENGTH(descriptionHtml) as html_len, LENGTH(rawJson) as raw_len FROM jobs WHERE description IS NOT NULL ORDER BY desc_len DESC LIMIT 5");
console.log('\nTop 5 largest job descriptions (bytes):');
descRows.forEach(r => console.log(' id:', r.id, '| desc:', r.desc_len, '| html:', r.html_len, '| raw:', r.raw_len));
await conn.end();
