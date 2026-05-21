import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateJWT, authorizeRole } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Obtener todas las zonas
router.get("/", async (req, res) => {
  try {
    const zones = await prisma.restrictedZone.findMany();
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener zonas restringidas" });
  }
});

// Crear una zona (Solo ADMIN o RESPONSABLE)
router.post("/", authenticateJWT, authorizeRole(["ADMIN", "RESPONSABLE"]), async (req, res) => {
  try {
    const { id, name, type, center, radius, points, upperLimit, lowerLimit, startTime, endTime, daysOfWeek, specificDate, isActive } = req.body;
    
    const zone = await prisma.restrictedZone.create({
      data: {
        id: id || `ZONE_${Date.now()}`,
        name,
        type,
        center: center ? JSON.stringify(center) : null,
        radius: radius ? parseFloat(radius) : null,
        points: points ? JSON.stringify(points) : null,
        upperLimit,
        lowerLimit,
        startTime,
        endTime,
        daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : null,
        specificDate,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json(zone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear zona restringida" });
  }
});

// Eliminar una zona
router.delete("/:id", authenticateJWT, authorizeRole(["ADMIN", "RESPONSABLE"]), async (req, res) => {
  try {
    await prisma.restrictedZone.delete({
      where: { id: req.params.id }
    });
    res.json({ message: "Zona eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar zona" });
  }
});

export default router;
