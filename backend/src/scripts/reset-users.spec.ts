import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    $disconnect: vi.fn(),
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
    hash: vi.fn().mockResolvedValue("hashed"),
  },
}));

import { main } from "./reset-users";

describe("Reset Users Script", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete users and create admin", async () => {
    mockPrisma.user.deleteMany.mockResolvedValueOnce({ count: 5 });
    mockPrisma.user.create.mockResolvedValueOnce({ id: 1 });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await main();

    expect(mockPrisma.user.deleteMany).toHaveBeenCalledWith({});
    expect(mockPrisma.user.create).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
