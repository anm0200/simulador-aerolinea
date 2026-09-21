const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = [
    `INSERT INTO public."User" ("id", "email", "password", "name", "role", "createdAt", "isVerified", "verificationCode", "googleId") VALUES ('de61cde3-cf5c-4d21-b777-e5d531bbbcf3', 'admin@flyradar.com', '$2b$10$QMwN4kK4mT6hinzG9Z1fZOgfuC1PNuBBaMBU780nwlYtuWrbrgAi.', 'Administrador Principal', 'RESPONSABLE', '2026-05-04 09:22:30.453', true, NULL, NULL);`,
    `INSERT INTO public."User" ("id", "email", "password", "name", "role", "createdAt", "isVerified", "verificationCode", "googleId") VALUES ('3ac13568-cd48-4362-a83d-760370eee95f', 'cliente@flyradar.com', '$2b$10$dSAYs78Uva5h987v8Nq6K.DIT7GXKaNDcOfsSULjVeRwg.yZY6yZu', 'Cliente de Prueba', 'CLIENTE', '2026-05-20 08:48:18.663', true, NULL, NULL);`,
    `INSERT INTO public."User" ("id", "email", "password", "name", "role", "createdAt", "isVerified", "verificationCode", "googleId") VALUES ('5544db74-6165-4c72-bc3b-bac8f41e2c8c', 'noreplymagicvs@gmail.com', '$2b$10$QA7QoLhCf2NaPXnNswR2S.3/hHsf07bENyOiiTcCLxnGt61OrS9bG', 'prueba', 'CLIENTE', '2026-05-30 03:02:40.08', true, NULL, NULL);`,
    `INSERT INTO public."User" ("id", "email", "password", "name", "role", "createdAt", "isVerified", "verificationCode", "googleId") VALUES ('4b3c9ea9-95b6-4231-bd2f-f521128edac1', 'martaaa6d2@gmail.com', '$2b$10$J8rDhfviQ6vgBDPcEMqA3OQR6h33bzhIHlwh2IyvpA5lf8gNWJ0zq', 'marta', 'CLIENTE', '2026-05-30 03:23:23.575', true, NULL, NULL);`,
    `INSERT INTO public."User" ("id", "email", "password", "name", "role", "createdAt", "isVerified", "verificationCode", "googleId") VALUES ('5c84b8d9-bfc6-4c6f-9368-f4e8eddf24d4', 'anm020@inlumine.ual.es', '$2b$10$buIpiZD9F687lJJmOhQIjeRkAmdIFuHEQfP/yhqwwf4UTpquf68Xe', 'pruebillas', 'CLIENTE', '2026-05-04 09:29:39.437', true, NULL, '118185483231461612881');`,
    `INSERT INTO public."User" ("id", "email", "password", "name", "role", "createdAt", "isVerified", "verificationCode", "googleId") VALUES ('1881acd3-11e0-48b1-96c9-c58f6e2f96fd', 'anieto436436@gmail.com', '$2b$10$I4vsrGtyvrzChj2RwdYeY.xtmEIsactH0PEj93nidz6kVyIYt1UUC', 'Antonio Rafael Nieto Mora', 'CLIENTE', '2026-05-04 09:25:06.083', true, NULL, '115751946796365470470');`
  ];

  const reservations = [
    `INSERT INTO public."Reservation" ("id", "userId", "flightId", "createdAt", "specificDate", "type") VALUES ('e0d8ecb0-13dd-4ce2-9c1c-5431493b0812', '5c84b8d9-bfc6-4c6f-9368-f4e8eddf24d4', 'IB2349', '2026-05-04 09:53:36.76', NULL, 'DAILY');`,
    `INSERT INTO public."Reservation" ("id", "userId", "flightId", "createdAt", "specificDate", "type") VALUES ('4993a378-ac51-4284-bc6a-cd4638e2db65', '1881acd3-11e0-48b1-96c9-c58f6e2f96fd', 'IB9999', '2026-05-20 08:49:51.721', NULL, 'DAILY');`,
    `INSERT INTO public."Reservation" ("id", "userId", "flightId", "createdAt", "specificDate", "type") VALUES ('41801247-22ba-407e-b418-5d74de849fcd', '1881acd3-11e0-48b1-96c9-c58f6e2f96fd', 'UX4021', '2026-05-20 08:49:54.172', NULL, 'DAILY');`,
    `INSERT INTO public."Reservation" ("id", "userId", "flightId", "createdAt", "specificDate", "type") VALUES ('a311afbb-4671-4e2c-af56-36631393d44a', 'de61cde3-cf5c-4d21-b777-e5d531bbbcf3', 'IB3014', '2026-05-30 02:19:32.165', '2026-06-03', 'SPECIFIC_DATE');`
  ];

  for (const stmt of [...users, ...reservations]) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log('Success');
    } catch (e) {
      console.error(e.message);
    }
  }
}

main().finally(() => prisma.$disconnect());
