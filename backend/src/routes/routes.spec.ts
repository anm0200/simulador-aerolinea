import { describe, it, expect } from "vitest";
import authRoutes from "./auth.routes";
import restrictedZonesRoutes from "./restricted-zones.routes";

describe("Routes setup", () => {
  it("should configure auth routes", () => {
    expect(authRoutes).toBeDefined();
    expect(authRoutes.name).toBe("router");
  });

  it("should configure restricted zones routes", () => {
    expect(restrictedZonesRoutes).toBeDefined();
    expect(restrictedZonesRoutes.name).toBe("router");
  });
});
