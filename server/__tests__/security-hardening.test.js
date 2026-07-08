import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { googleAuth } from "../controllers/auth.controller.js";
import { admin } from "../config/firebaseAdmin.js";

process.env.JWT_SECRET = "test-secret-key-hardening-2026";

describe("Security Hardening Tests - googleAuth", () => {
  let mockRes;
  let mockReq;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    mockReq = {
      get: jest.fn().mockReturnValue("test-agent"),
      ip: "127.0.0.1",
      cookies: {},
      body: {},
    };
    jest.clearAllMocks();
  });

  test("SHOULD reject login for deactivated users", async () => {
    const mockUser = {
      _id: "inactive-uid",
      email: "inactive@example.com",
      isActive: false,
      save: jest.fn().mockResolvedValue(true),
    };

    jest.spyOn(User, "findOne").mockResolvedValue(mockUser);
    jest.spyOn(admin, "auth").mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({
        email: "inactive@example.com",
        email_verified: true,
        uid: "firebase-uid",
      }),
    });

    mockReq.body = { idToken: "valid-token" };

    await googleAuth(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/deactivated|disabled/i) })
    );
  });

  test("SHOULD prioritize verified data from Firebase over request body", async () => {
    const mockUser = {
      _id: "user-uid",
      email: "victim@example.com",
      name: "Verified Name",
      picture: "verified-photo.jpg",
      isActive: true,
      save: jest.fn().mockResolvedValue(true),
    };

    jest.spyOn(User, "findOne").mockResolvedValue(mockUser);
    jest.spyOn(admin, "auth").mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({
        email: "victim@example.com",
        email_verified: true,
        uid: "firebase-uid",
        name: "Verified Name",
        picture: "verified-photo.jpg",
      }),
    });

    mockReq.body = {
      idToken: "valid-token",
      name: "ATTACKER NAME",
      photo: "http://attacker.com/malicious.jpg",
    };

    await googleAuth(mockReq, mockRes);

    expect(mockUser.name).not.toBe("ATTACKER NAME");
    expect(mockUser.picture).not.toBe("http://attacker.com/malicious.jpg");
  });
});
