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
    // Obtenemos la hora actual en el timezone del sistema (ahora Europe/Madrid)
    const now = new Date();

    // Forzamos el formato HH:mm usando la configuración local de España
    const currentTime = now.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: process.env["TZ"] || "Europe/Madrid",
    });

    console.log(
      `[Worker] [${now.toISOString()}] Comprobando vuelos para las ${currentTime} (TZ: ${process.env["TZ"]})`,
    );

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

      const todayDate = new Date().toLocaleDateString("sv-SE", {
        timeZone: process.env["TZ"] || "Europe/Madrid",
      });

      for (const flight of departingFlights) {
        for (const res of flight.reservations) {
          const isValid = res.type === 'DAILY' || (res.type === 'SPECIFIC_DATE' && res.specificDate === todayDate);
          if (!isValid) continue;

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

        // Calculamos la hora de llegada sumando la duración
        const arrivalDate = new Date();
        arrivalDate.setHours(hours, minutes + flight.durationMinutes, 0, 0);

        const arrivalTime = arrivalDate.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: process.env["TZ"] || "Europe/Madrid",
        });

        if (arrivalTime === currentTime) {
          for (const res of flight.reservations) {
            const isValid = res.type === 'DAILY' || (res.type === 'SPECIFIC_DATE' && res.specificDate === todayDate);
            if (!isValid) continue;

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
