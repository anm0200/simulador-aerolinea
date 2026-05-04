import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { sendFlightEmail } from "../services/email.service.js";

const prisma = new PrismaClient();

export const startNotificationWorker = () => {
  console.log("Iniciando trabajador de notificaciones...");

  // Se ejecuta cada minuto
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0-6 (Dom-Sab)
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
          const subject = `🚀 ¡Buen viaje! Tu vuelo ${flight.id} acaba de despegar`;
          const text = `Hola ${res.user.name}, te informamos que el vuelo ${flight.id} con origen ${flight.origin.name} (${flight.origin.city}) acaba de despegar puntual a las ${flight.departureTime}.`;
          await sendFlightEmail(res.user.email, subject, text);
        }
      }

      // 2. Buscar vuelos que llegan AHORA
      // Nota: Esto es una simplificación. Calculamos la hora de llegada sumando la duración.
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
            const subject = `🛬 ¡Bienvenido! El vuelo ${flight.id} ha aterrizado`;
            const text = `Hola ${res.user.name}, te informamos que el vuelo ${flight.id} acaba de aterrizar con éxito en ${flight.destination.name} (${flight.destination.city}). Esperamos que hayas tenido un excelente vuelo.`;
            await sendFlightEmail(res.user.email, subject, text);
          }
        }
      }
    } catch (error) {
      console.error("Error en el worker de notificaciones:", error);
    }
  });
};
