import { jest } from '@jest/globals';

// Mock firebase-admin completely before importing auth controller
jest.unstable_mockModule("firebase-admin/app", () => ({
  initializeApp: jest.fn(),
  cert: jest.fn(),
  getApps: jest.fn(() => []),
}));

const mockVerifyIdToken = jest.fn();
jest.unstable_mockModule("firebase-admin/auth", () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

jest.unstable_mockModule("../config/token.js", () => ({
  genToken: jest.fn(() => "mock-token"),
  genAccessToken: jest.fn(() => "mock-access-token"),
  genRefreshToken: jest.fn(() => "mock-refresh-token"),
}));

// Set env vars so controller tries to initialize firebase
process.env.FIREBASE_PROJECT_ID = "test";
process.env.FIREBASE_CLIENT_EMAIL = "test@test.com";
process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDTEST\n-----END PRIVATE KEY-----";
process.env.JWT_SECRET = "test-secret";

// Import after mocking
const { googleAuth } = await import("../controllers/auth.controller.js");
const User = (await import("../models/user.model.js")).default;

jest.mock("../models/user.model.js");

describe("Security Hardening: Deactivation Bypass", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { idToken: "valid-id-token" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  it("should reject deactivated users with 403 status", async () => {
    const mockUser = {
      _id: "user123",
      email: "deactivated@example.com",
      isActive: false,
      role: "user",
    };

    mockVerifyIdToken.mockResolvedValue({
      email: "deactivated@example.com",
      email_verified: true,
      uid: "firebase123",
    });

    User.findOne = jest.fn().mockResolvedValue(mockUser);

    await googleAuth(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Your account has been deactivated." })
    );
  });

  it("should allow active users and update lastLoginAt", async () => {
    const mockUser = {
      _id: "user123",
      email: "active@example.com",
      isActive: true,
      role: "user",
      save: jest.fn().mockResolvedValue(true),
    };

    mockVerifyIdToken.mockResolvedValue({
      email: "active@example.com",
      email_verified: true,
      uid: "firebase123",
    });

    User.findOne = jest.fn().mockResolvedValue(mockUser);

    await googleAuth(req, res);

    if (res.status.mock.calls[0][0] === 500) {
        console.log("500 error in active user test:", res.json.mock.calls[0][0]);
    }

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockUser.save).toHaveBeenCalled();
    expect(mockUser.isActive).toBe(true);
  });
});
