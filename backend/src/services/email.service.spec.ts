import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSendMail } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

import {
  sendFlightEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendDepartureEmail,
  sendArrivalEmail,
} from "./email.service";

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendFlightEmail", () => {
    it("should return true on successful email send", async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: "123" });
      const result = await sendFlightEmail(
        "test@test.com",
        "Subject",
        "Text",
        "<p>HTML</p>",
      );
      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@test.com",
          subject: "Subject",
          text: "Text",
          html: "<p>HTML</p>",
        }),
      );
    });

    it("should return false if sending email fails", async () => {
      mockSendMail.mockRejectedValueOnce(new Error("SMTP Error"));
      const result = await sendFlightEmail(
        "test@test.com",
        "Subject",
        "Text",
        "<p>HTML</p>",
      );
      expect(result).toBe(false);
    });
  });

  describe("sendVerificationEmail", () => {
    it("should send verification email", async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: "123" });
      const result = await sendVerificationEmail("test@test.com", "123456");
      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Código de Verificación"),
          html: expect.stringContaining("123456"),
        }),
      );
    });
  });

  describe("sendWelcomeEmail", () => {
    it("should send welcome email", async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: "123" });
      const result = await sendWelcomeEmail("test@test.com", "John Doe");
      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Tu cuenta ha sido activada"),
          html: expect.stringContaining("John Doe"),
        }),
      );
    });
  });

  describe("sendDepartureEmail", () => {
    it("should send departure email", async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: "123" });
      const mockFlight = {
        id: "FL123",
        departureTime: "10:00",
        durationMinutes: 120,
        origin: { id: "MAD", city: "Madrid" },
        destination: { id: "BCN", city: "Barcelona" },
      };

      const result = await sendDepartureEmail(
        "test@test.com",
        "John Doe",
        mockFlight,
      );

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("FL123 está en el aire"),
          html: expect.stringContaining("Madrid"),
        }),
      );
    });
  });

  describe("sendArrivalEmail", () => {
    it("should send arrival email", async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: "123" });
      const mockFlight = {
        id: "FL123",
        destination: { id: "BCN", city: "Barcelona", name: "El Prat" },
      };

      const result = await sendArrivalEmail(
        "test@test.com",
        "John Doe",
        mockFlight,
      );

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("FL123 ha aterrizado en Barcelona"),
          html: expect.stringContaining("Barcelona"),
        }),
      );
    });
  });
});
