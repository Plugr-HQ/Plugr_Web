import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT id, "Type", "Email", "Full Name", "Phone Number", "Location", created_at
      FROM "Plugr Waitlist"
      ORDER BY id DESC
      LIMIT 5;
    `);
    console.log('Latest waitlist entries:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
