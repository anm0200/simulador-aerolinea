import { Client } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

// Cargar variables de entorno del backend si es necesario, o usar valores por defecto locales
dotenv.config({ path: path.resolve(__dirname, "../../../backend/.env") });

let connectionString =
  process.env.DATABASE_URL ||
  "postgresql://user:password@localhost:5432/mapsim?schema=public";
// Si el script se ejecuta fuera del backend (en E2E), apuntar a localhost en lugar del nombre del contenedor
if (connectionString.includes("@database:")) {
  connectionString = connectionString.replace("@database:", "@localhost:");
}

import * as bcrypt from "bcryptjs";

export class DbSetup {
  static async cleanupE2EData() {
    const client = new Client({
      connectionString,
    });

    try {
      await client.connect();

      console.log("[E2E DB Cleanup] Eliminando datos de prueba E2E...");

      // Borramos primero dependencias (vuelos, zonas, reservas) y luego usuarios
      // Usaremos CASCADE o borrado manual si es necesario. Prisma normalmente configura RESTRICT o CASCADE.

      // Borrar Reservas de usuarios E2E
      await client.query(
        `DELETE FROM "Reservation" WHERE "userId" IN (SELECT id FROM "User" WHERE email LIKE 'e2e_%')`,
      );

      // Borrar Vuelos E2E
      await client.query(`DELETE FROM "Flight" WHERE "id" LIKE 'E2E%'`);

      // Borrar Zonas Restringidas E2E
      await client.query(
        `DELETE FROM "RestrictedZone" WHERE "name" LIKE 'E2E_%'`,
      );

      // Borrar Aeropuertos E2E
      await client.query(`DELETE FROM "Airport" WHERE "id" LIKE 'E2E%'`);

      // Finalmente, borrar usuarios E2E
      await client.query(`DELETE FROM "User" WHERE email LIKE 'e2e_%'`);

      console.log("[E2E DB Cleanup] Datos de prueba eliminados correctamente.");
    } catch (error) {
      console.error(
        "[E2E DB Cleanup] Error limpiando la base de datos:",
        error,
      );
    } finally {
      await client.end();
    }
  }

  // Utilidad auxiliar por si necesitamos insertar un usuario responsable directo desde BD para los tests de gestión
  static async seedE2EResponsable() {
    const client = new Client({ connectionString });
    try {
      await client.connect();
      // Borrar si existe
      await client.query(
        `DELETE FROM "User" WHERE email = 'e2e_admin@test.com'`,
      );

      // Insertar admin con contraseña dinamica
      const hashedPassword = await bcrypt.hash("E2E_Admin123!", 10);

      await client.query(
        `
        INSERT INTO "User" (id, email, password, name, role, "isVerified", "createdAt")
        VALUES (
          gen_random_uuid(), 
          'e2e_admin@test.com', 
          $1, 
          'E2E Admin', 
          'RESPONSABLE', 
          true, 
          NOW()
        )
      `,
        [hashedPassword],
      );
      console.log("[E2E DB Setup] Usuario E2E Responsable creado.");
    } catch (error) {
      console.error(
        "[E2E DB Setup] Error creando usuario responsable E2E:",
        error,
      );
    } finally {
      await client.end();
    }
  }
}
