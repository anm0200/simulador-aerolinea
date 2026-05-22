import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticateJWT, authorizeRole, AuthRequest } from "./auth";
import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";

// Mock jsonwebtoken
vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

describe("Auth Middleware", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      sendStatus: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    nextFunction = vi.fn();
    vi.clearAllMocks();
  });

  describe("authenticateJWT", () => {
    it("should return 401 if authorization header is missing", () => {
      authenticateJWT(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction,
      );
      expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 403 if token is invalid", () => {
      mockRequest.headers = { authorization: "Bearer invalid_token" };

      // Simulate jwt.verify throwing an error
      (jwt.verify as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (token, secret, callback) => {
          callback(new Error("Invalid token"), null);
        },
      );

      authenticateJWT(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction,
      );
      expect(mockResponse.sendStatus).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should call next and set req.user if token is valid", () => {
      mockRequest.headers = { authorization: "Bearer valid_token" };
      const mockUser = { id: "123", role: "ADMIN" };

      // Simulate jwt.verify succeeding
      (jwt.verify as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (token, secret, callback) => {
          callback(null, mockUser);
        },
      );

      authenticateJWT(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction,
      );
      expect(mockRequest.user).toEqual(mockUser);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe("authorizeRole", () => {
    it("should return 403 if user is not defined in request", () => {
      const middleware = authorizeRole(["ADMIN"]);
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Acceso denegado: permisos insuficientes",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 403 if user role is not authorized", () => {
      mockRequest.user = { id: "123", role: "USER" };
      const middleware = authorizeRole(["ADMIN", "RESPONSABLE"]);
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Acceso denegado: permisos insuficientes",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should call next if user role is authorized", () => {
      mockRequest.user = { id: "123", role: "ADMIN" };
      const middleware = authorizeRole(["ADMIN", "RESPONSABLE"]);
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
