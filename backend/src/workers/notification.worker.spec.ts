import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    flight: {
      findMany: vi.fn(),
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

vi.mock("../services/email.service.js", () => ({
  sendDepartureEmail: vi.fn().mockResolvedValue(true),
  sendArrivalEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("node-cron", () => ({
  default: {
    schedule: vi.fn(),
  },
}));

import { startNotificationWorker } from "./notification.worker";
import cron from "node-cron";
import { sendDepartureEmail, sendArrivalEmail } from "../services/email.service.js";

describe("Notification Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 1, 1, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should schedule a cron job", () => {
    startNotificationWorker();
    expect(cron.schedule).toHaveBeenCalledWith("* * * * *", expect.any(Function));
  });

  it("should process departing flights correctly", async () => {
    startNotificationWorker();
    const scheduleCall = (cron.schedule as any).mock.calls[0];
    const task = scheduleCall[1];

    mockPrisma.flight.findMany
      .mockResolvedValueOnce([
        {
          id: "FL1",
          departureTime: "10:00",
          durationMinutes: 60,
          reservations: [{ user: { email: "a@test.com", name: "A" } }],
        },
      ])
      .mockResolvedValueOnce([]);

    await task();

    expect(mockPrisma.flight.findMany).toHaveBeenCalledTimes(2);
    expect(sendDepartureEmail).toHaveBeenCalledTimes(1);
    expect(sendDepartureEmail).toHaveBeenCalledWith("a@test.com", "A", expect.any(Object));
  });

  it("should process arriving flights correctly", async () => {
    startNotificationWorker();
    const scheduleCall = (cron.schedule as any).mock.calls[0];
    const task = scheduleCall[1];

    mockPrisma.flight.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "FL2",
          departureTime: "08:00",
          durationMinutes: 120,
          reservations: [{ user: { email: "b@test.com", name: "B" } }],
        },
        {
          id: "FL3",
          departureTime: "08:00",
          durationMinutes: 60,
          reservations: [{ user: { email: "c@test.com", name: "C" } }],
        },
      ]);

    await task();

    expect(sendArrivalEmail).toHaveBeenCalledTimes(1);
    expect(sendArrivalEmail).toHaveBeenCalledWith("b@test.com", "B", expect.any(Object));
  });

  it("should catch errors gracefully", async () => {
    startNotificationWorker();
    const task = (cron.schedule as any).mock.calls[0][1];
    
    mockPrisma.flight.findMany.mockRejectedValueOnce(new Error("DB Error"));
    
    await expect(task()).resolves.toBeUndefined();
  });
});
