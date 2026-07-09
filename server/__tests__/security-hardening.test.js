import { jest } from "@jest/globals";
import User from "../models/user.model.js";
import { admin } from "../config/firebaseAdmin.js";
import { googleAuth } from "../controllers/auth.controller.js";

process.env.JWT_SECRET = "test-secret";

describe("Security Hardening: googleAuth", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { idToken: "valid-token", name: "Client Name", photo: "client-photo" },
      ip: "127.0.0.1",
      get: jest.fn().mockReturnValue("Mozilla/5.0"),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should reject deactivated users with 403", async () => {
    const mockUser = {
      _id: "668c6a0d24f9f4b3c8a9e1a1",
      email: "deactivated@example.com",
      isActive: false,
      role: "user",
    };

    jest.spyOn(admin, "auth").mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({
        email: "deactivated@example.com",
        email_verified: true,
        uid: "firebase-123",
      }),
    });

    jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

    await googleAuth(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("deactivated"),
      })
    );
  });

  test("should prioritize Firebase token claims for name and picture", async () => {
    const mockUser = {
      _id: "668c6a0d24f9f4b3c8a9e1a2",
      email: "verified@example.com",
      isActive: true,
      role: "user",
      save: jest.fn().mockResolvedValue(true),
    };

    jest.spyOn(admin, "auth").mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({
        email: "verified@example.com",
        email_verified: true,
        uid: "firebase-456",
        name: "Firebase Name",
        picture: "firebase-photo",
      }),
    });

    jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

    await googleAuth(req, res);

    expect(mockUser.name).toBe("Firebase Name");
    expect(mockUser.picture).toBe("firebase-photo");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
