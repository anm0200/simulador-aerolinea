import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock_token"),
  },
}));

vi.mock("../services/email.service.js", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}));

import { register, verify, login, createResponsable } from "./auth.controller";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";

describe("Auth Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should return 400 if password does not meet criteria", async () => {
      mockRequest.body = { email: "test@test.com", password: "weak", name: "Test" };
      await register(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "La contraseña debe tener entre 8 y 12 caracteres, incluir una mayúscula, una minúscula, un número y un símbolo.",
      });
    });

    it("should return 400 if user already exists", async () => {
      mockRequest.body = { email: "test@test.com", password: "Str0ngP1!", name: "Test" };
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "1" });
      
      await register(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "El usuario ya existe" });
    });

    it("should create user and send email if data is valid", async () => {
      mockRequest.body = { email: "test@test.com", password: "Str0ngP1!", name: "Test" };
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({});
      
      await register(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Usuario registrado. Revisa tu email para el código de verificación.",
      });
    });

    it("should return 500 on internal error", async () => {
      mockRequest.body = { email: "test@test.com", password: "Str0ngP1!", name: "Test" };
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error("DB Error"));
      
      await register(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "Error al registrar usuario" });
    });
  });

  describe("verify", () => {
    it("should return 400 if user not found or code incorrect", async () => {
      mockRequest.body = { email: "test@test.com", code: "123456" };
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      
      await verify(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "Código de verificación incorrecto" });
    });

    it("should update user and send welcome email if valid", async () => {
      mockRequest.body = { email: "test@test.com", code: "123456" };
      mockPrisma.user.findUnique.mockResolvedValueOnce({ email: "test@test.com", verificationCode: "123456", name: "Test" });
      mockPrisma.user.update.mockResolvedValueOnce({});
      
      await verify(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Cuenta verificada con éxito. Ya puedes iniciar sesión.",
      });
    });

    it("should return 500 on internal error", async () => {
      mockRequest.body = { email: "test@test.com", code: "123456" };
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error("DB Error"));
      
      await verify(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe("login", () => {
    it("should return 401 if user not found", async () => {
      mockRequest.body = { email: "test@test.com", password: "password" };
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      
      await login(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it("should return 403 if user is not verified", async () => {
      mockRequest.body = { email: "test@test.com", password: "password" };
      mockPrisma.user.findUnique.mockResolvedValueOnce({ isVerified: false });
      
      await login(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it("should return 401 if password does not match", async () => {
      mockRequest.body = { email: "test@test.com", password: "password" };
      mockPrisma.user.findUnique.mockResolvedValueOnce({ isVerified: true, password: "hash" });
      (bcrypt.compare as any).mockResolvedValueOnce(false);
      
      await login(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it("should return token and user data if successful", async () => {
      mockRequest.body = { email: "test@test.com", password: "password" };
      const user = { id: "1", email: "test@test.com", name: "Test", role: "CLIENTE", isVerified: true, password: "hash" };
      mockPrisma.user.findUnique.mockResolvedValueOnce(user);
      (bcrypt.compare as any).mockResolvedValueOnce(true);
      
      await login(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.json).toHaveBeenCalledWith({
        token: "mock_token",
        user: { id: "1", email: "test@test.com", name: "Test", role: "CLIENTE" },
      });
    });

    it("should return 500 on internal error", async () => {
      mockRequest.body = { email: "test@test.com", password: "password" };
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error("DB Error"));
      
      await login(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createResponsable", () => {
    it("should return 400 if user exists", async () => {
      mockRequest.body = { email: "test@test.com", password: "Str0ngP1!", name: "Test" };
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "1" });
      
      await createResponsable(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should create responsable if valid", async () => {
      mockRequest.body = { email: "test@test.com", password: "Str0ngP1!", name: "Test" };
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({ email: "test@test.com", name: "Test" });
      
      await createResponsable(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Responsable creado con éxito",
        user: { email: "test@test.com", name: "Test" },
      });
    });

    it("should return 500 on internal error", async () => {
      mockRequest.body = { email: "test@test.com", password: "Str0ngP1!", name: "Test" };
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error("DB Error"));
      
      await createResponsable(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});
