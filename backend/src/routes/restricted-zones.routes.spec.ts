import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import restrictedZonesRoutes from "./restricted-zones.routes";
import { PrismaClient } from "@prisma/client";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    restrictedZone: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      return mockPrisma;
    }
  },
}));

// Mock Auth
vi.mock("../middleware/auth.js", () => ({
  authenticateJWT: (req: any, res: any, next: any) => next(),
  authorizeRole: () => (req: any, res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use("/api/restricted-zones", restrictedZonesRoutes);

const prisma = new PrismaClient();

describe("Restricted Zones Routes", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("should return all zones", async () => {
      const mockZones = [{ id: "1", name: "Zone 1" }];
      (prisma.restrictedZone.findMany as any).mockResolvedValueOnce(mockZones);

      const res = await request(app).get("/api/restricted-zones");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockZones);
    });

    it("should return 500 on error", async () => {
      (prisma.restrictedZone.findMany as any).mockRejectedValueOnce(
        new Error("DB Error"),
      );

      const res = await request(app).get("/api/restricted-zones");
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Error al obtener zonas restringidas");
    });
  });

  describe("POST /", () => {
    it("should create a zone", async () => {
      const newZone = {
        name: "Test Zone",
        center: { lat: 0, lng: 0 },
        radius: 50,
      };
      const createdZone = {
        id: "ZONE_123",
        ...newZone,
        center: JSON.stringify(newZone.center),
      };
      (prisma.restrictedZone.create as any).mockResolvedValueOnce(createdZone);

      const res = await request(app)
        .post("/api/restricted-zones")
        .send(newZone);
      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdZone);
    });

    it("should return 500 on error", async () => {
      (prisma.restrictedZone.create as any).mockRejectedValueOnce(
        new Error("DB Error"),
      );

      const res = await request(app).post("/api/restricted-zones").send({});
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Error al crear zona restringida");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete a zone", async () => {
      (prisma.restrictedZone.delete as any).mockResolvedValueOnce({});

      const res = await request(app).delete("/api/restricted-zones/1");
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Zona eliminada correctamente");
    });

    it("should return 500 on error", async () => {
      (prisma.restrictedZone.delete as any).mockRejectedValueOnce(
        new Error("DB Error"),
      );

      const res = await request(app).delete("/api/restricted-zones/1");
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Error al eliminar zona");
    });
  });
});
