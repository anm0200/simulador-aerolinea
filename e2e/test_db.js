const { Client } = require("pg");

const client = new Client({
  connectionString:
    "postgresql://user:password@localhost:5432/mapsim?schema=public",
});

async function run() {
  await client.connect();
  const res = await client.query(
    `SELECT email, password, "isVerified" FROM "User" WHERE email = 'e2e_admin@test.com'`,
  );
  console.log("DB RESULT:", res.rows);
  await client.end();
}

run();
