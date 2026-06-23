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

    // Check all constraints on the table
    const constraints = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'Plugr Waitlist';
    `);
    console.log('Constraints on "Plugr Waitlist":');
    console.table(constraints.rows);

    // Check indexes
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'Plugr Waitlist';
    `);
    console.log('\nIndexes on "Plugr Waitlist":');
    console.table(indexes.rows);

    // Count total rows
    const count = await client.query(`SELECT COUNT(*) FROM "Plugr Waitlist";`);
    console.log('\nTotal rows:', count.rows[0].count);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
