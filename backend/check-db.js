const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const flights = await prisma.flight.count();
  const airports = await prisma.airport.count();
  console.log(`Flights: ${flights}, Airports: ${airports}`);
}
main().finally(() => prisma.$disconnect());
