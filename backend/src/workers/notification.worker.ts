import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import {
  sendDepartureEmail,
  sendArrivalEmail,
} from "../services/email.service.js";

const prisma = new PrismaClient();

export const startNotificationWorker = () => {
  console.log("Iniciando trabajador de notificaciones...");

  // Se ejecuta cada minuto
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    console.log(`[Worker] Comprobando vuelos para las ${currentTime}`);

    try {
      // 1. Buscar vuelos que salen AHORA
      const departingFlights = await prisma.flight.findMany({
        where: {
          departureTime: currentTime,
          isActive: true,
        },
        include: {
          reservations: {
            include: { user: true },
          },
          origin: true,
          destination: true,
        },
      });

      for (const flight of departingFlights) {
        for (const res of flight.reservations) {
          console.log(
            `[Worker] Enviando notificación de DESPEGUE para ${flight.id} a ${res.user.email}`,
          );
          await sendDepartureEmail(res.user.email, res.user.name, flight);
        }
      }

      // 2. Buscar vuelos que llegan AHORA
      const allActiveFlights = await prisma.flight.findMany({
        where: { isActive: true },
        include: {
          reservations: { include: { user: true } },
          origin: true,
          destination: true,
        },
      });

      for (const flight of allActiveFlights) {
        const [hours, minutes] = flight.departureTime.split(":").map(Number);
        const arrivalDate = new Date();
        arrivalDate.setHours(hours, minutes + flight.durationMinutes, 0, 0);

        const arrivalTime = `${arrivalDate.getHours().toString().padStart(2, "0")}:${arrivalDate.getMinutes().toString().padStart(2, "0")}`;

        if (arrivalTime === currentTime) {
          for (const res of flight.reservations) {
            console.log(
              `[Worker] Enviando notificación de ATERRIZAJE para ${flight.id} a ${res.user.email}`,
            );
            await sendArrivalEmail(res.user.email, res.user.name, flight);
          }
        }
      }
    } catch (error) {
      console.error("Error en el worker de notificaciones:", error);
    }
  });
};
