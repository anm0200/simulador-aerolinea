const { Client } = require('pg'); 
const client = new Client('postgresql://user:password@localhost:5432/mapsim?schema=public'); 
client.connect().then(() => {
  client.query(`INSERT INTO "User" (id, email, password, name, role, "isVerified", "createdAt") VALUES (gen_random_uuid(), 'e2e_admin@test.com', '$2b$10$HkBkSgivj6BH7Vmgd/griee/1P.ZN0vOve8nQEBqWwdmamBHpwd/e', 'E2E Admin', 'RESPONSABLE', true, NOW()) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;`).then(() => { 
    console.log('Admin inserted'); 
    client.end(); 
  });
});
