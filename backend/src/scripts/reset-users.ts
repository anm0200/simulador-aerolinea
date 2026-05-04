import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Reseteando Usuarios ---");

  // 1. Borrar todos los usuarios
  const deleted = await prisma.user.deleteMany({});
  console.log(`Eliminados ${deleted.count} usuarios.`);

  // 2. Crear Administrador Responsable
  const hashedPassword = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@flyradar.com",
      password: hashedPassword,
      name: "Administrador Principal",
      role: "RESPONSABLE",
      isVerified: true,
    },
  });

  console.log("Administrador creado con éxito:");
  console.log("Email: admin@flyradar.com");
  console.log("Password: Admin123!");
  console.log("---------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
