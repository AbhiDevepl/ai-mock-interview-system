import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { jest } from "@jest/globals";

// Mocking dependencies
jest.unstable_mockModule("../config/logger.js", () => ({
  logAuthEvent: jest.fn(),
}));

jest.unstable_mockModule("../services/session.service.js", () => ({
  getSession: jest.fn(),
  isJtiBlacklisted: jest.fn(),
  createSession: jest.fn(),
  deleteSession: jest.fn(),
  generateDeviceId: jest.fn(),
  blacklistJti: jest.fn(),
  recordLoginAttempt: jest.fn(),
  isLoginBlocked: jest.fn(),
}));

jest.unstable_mockModule("../services/cache.service.js", () => ({
  setCachedUser: jest.fn(),
  invalidateAllUserCaches: jest.fn(),
}));

jest.unstable_mockModule("../config/firebaseAdmin.js", () => ({
  admin: {
    auth: () => ({
      verifyIdToken: jest.fn()
    })
  }
}));

const mockUserFindById = jest.fn();
jest.unstable_mockModule("../models/user.model.js", () => ({
  default: {
    findById: mockUserFindById,
    findOne: jest.fn(),
    create: jest.fn(),
  }
}));

// We need to import the middleware and controllers after mocking
const { default: isAuth, optionalAuth } = await import("../middleware/isAuth.js");
const { getCurrentUser } = await import("../controllers/user.controller.js");
const { getMe } = await import("../controllers/auth.controller.js");
const { getSession, isJtiBlacklisted } = await import("../services/session.service.js");

process.env.JWT_SECRET = "test-secret";

describe("Hardening Security Tests", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Test routes
    app.get("/test-auth", isAuth, (req, res) => res.status(200).json({ userId: req.userId }));
    app.get("/test-optional", optionalAuth, (req, res) => res.status(200).json({ userId: req.userId || null }));

    // Controller routes - mimicking middleware setting req.userId
    app.get("/api/user/current-user", (req, res, next) => { req.userId = "user123"; next(); }, getCurrentUser);
    app.get("/api/auth/me", (req, res, next) => { req.userId = "user123"; next(); }, getMe);
  });

  const genTestToken = (userId, jti = uuidv4()) => {
    return jwt.sign({ userId, role: "user", jti }, process.env.JWT_SECRET);
  };

  describe("isAuth Middleware Hardening", () => {
    test("should clear BOTH cookies when deviceId is missing", async () => {
      const token = genTestToken("user123");
      const response = await request(app)
        .get("/test-auth")
        .set("Cookie", [`token=${token}`]);

      expect(response.status).toBe(401);
      const cookies = response.headers["set-cookie"];
      expect(cookies).toContainEqual(expect.stringMatching(/token=;/));
      expect(cookies).toContainEqual(expect.stringMatching(/deviceId=;/));
    });

    test("should clear BOTH cookies when session is missing/mismatched", async () => {
      const jti = uuidv4();
      const token = genTestToken("user123", jti);
      getSession.mockResolvedValue(null); // No session found

      const response = await request(app)
        .get("/test-auth")
        .set("Cookie", [`token=${token}`, "deviceId=device123"]);

      expect(response.status).toBe(401);
      const cookies = response.headers["set-cookie"];
      expect(cookies).toContainEqual(expect.stringMatching(/token=;/));
      expect(cookies).toContainEqual(expect.stringMatching(/deviceId=;/));
    });

    test("should clear BOTH cookies when token is blacklisted", async () => {
      const jti = uuidv4();
      const token = genTestToken("user123", jti);
      getSession.mockResolvedValue({ jti });
      isJtiBlacklisted.mockResolvedValue(true);

      const response = await request(app)
        .get("/test-auth")
        .set("Cookie", [`token=${token}`, "deviceId=device123"]);

      expect(response.status).toBe(401);
      const cookies = response.headers["set-cookie"];
      expect(cookies).toContainEqual(expect.stringMatching(/token=;/));
      expect(cookies).toContainEqual(expect.stringMatching(/deviceId=;/));
    });

    test("should clear BOTH cookies on invalid token signature", async () => {
      const response = await request(app)
        .get("/test-auth")
        .set("Cookie", ["token=invalid-token", "deviceId=device123"]);

      expect(response.status).toBe(401);
      const cookies = response.headers["set-cookie"];
      expect(cookies).toContainEqual(expect.stringMatching(/token=;/));
      expect(cookies).toContainEqual(expect.stringMatching(/deviceId=;/));
    });
  });

  describe("optionalAuth Middleware Hardening", () => {
    test("should clear BOTH cookies in optionalAuth if token present but deviceId missing", async () => {
      const token = genTestToken("user123");
      const response = await request(app)
        .get("/test-optional")
        .set("Cookie", [`token=${token}`]);

      expect(response.status).toBe(200); // optionalAuth doesn't block
      expect(response.body.userId).toBeNull();
      const cookies = response.headers["set-cookie"];
      expect(cookies).toContainEqual(expect.stringMatching(/token=;/));
      expect(cookies).toContainEqual(expect.stringMatching(/deviceId=;/));
    });

    test("should clear BOTH cookies in optionalAuth if session mismatch", async () => {
      const jti = uuidv4();
      const token = genTestToken("user123", jti);
      getSession.mockResolvedValue(null);

      const response = await request(app)
        .get("/test-optional")
        .set("Cookie", [`token=${token}`, "deviceId=device123"]);

      expect(response.status).toBe(200);
      expect(response.body.userId).toBeNull();
      const cookies = response.headers["set-cookie"];
      expect(cookies).toContainEqual(expect.stringMatching(/token=;/));
      expect(cookies).toContainEqual(expect.stringMatching(/deviceId=;/));
    });
  });

  describe("Controller Hardening", () => {
    test("getCurrentUser should clear BOTH cookies if user is inactive", async () => {
      mockUserFindById.mockResolvedValue({ _id: "user123", isActive: false });

      const response = await request(app)
        .get("/api/user/current-user");

      expect(response.status).toBe(401);
      const cookies = response.headers["set-cookie"];
      expect(cookies).toContainEqual(expect.stringMatching(/token=;/));
      expect(cookies).toContainEqual(expect.stringMatching(/deviceId=;/));
    });

    test("getMe should clear BOTH cookies if user is missing", async () => {
      mockUserFindById.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/auth/me");

      expect(response.status).toBe(401);
      const cookies = response.headers["set-cookie"];
      expect(cookies).toContainEqual(expect.stringMatching(/token=;/));
      expect(cookies).toContainEqual(expect.stringMatching(/deviceId=;/));
    });
  });
});
