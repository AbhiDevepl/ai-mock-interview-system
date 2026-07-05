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

describe("Hardening Security Tests (Direct Invocation)", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      cookies: {},
      headers: {},
      get: jest.fn(),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  const genTestToken = (userId, jti = uuidv4()) => {
    return jwt.sign({ userId, role: "user", jti }, process.env.JWT_SECRET);
  };

  describe("isAuth Middleware Hardening", () => {
    test("should clear BOTH cookies when deviceId is missing", async () => {
      req.cookies.token = genTestToken("user123");

      await isAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("deviceId", expect.any(Object));
    });

    test("should clear BOTH cookies when session is missing/mismatched", async () => {
      const jti = uuidv4();
      req.cookies.token = genTestToken("user123", jti);
      req.cookies.deviceId = "device123";
      getSession.mockResolvedValue(null);

      await isAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("deviceId", expect.any(Object));
    });

    test("should clear BOTH cookies when token is blacklisted", async () => {
      const jti = uuidv4();
      req.cookies.token = genTestToken("user123", jti);
      req.cookies.deviceId = "device123";
      getSession.mockResolvedValue({ jti });
      isJtiBlacklisted.mockResolvedValue(true);

      await isAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("deviceId", expect.any(Object));
    });

    test("should clear BOTH cookies on invalid token signature", async () => {
      req.cookies.token = "invalid-token";
      req.cookies.deviceId = "device123";

      await isAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("deviceId", expect.any(Object));
    });
  });

  describe("optionalAuth Middleware Hardening", () => {
    test("should clear BOTH cookies in optionalAuth if token present but deviceId missing", async () => {
      req.cookies.token = genTestToken("user123");

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userId).toBeUndefined();
      expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("deviceId", expect.any(Object));
    });

    test("should clear BOTH cookies in optionalAuth if session mismatch", async () => {
      const jti = uuidv4();
      req.cookies.token = genTestToken("user123", jti);
      req.cookies.deviceId = "device123";
      getSession.mockResolvedValue(null);

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userId).toBeUndefined();
      expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("deviceId", expect.any(Object));
    });
  });

  describe("Controller Hardening", () => {
    test("getCurrentUser should clear BOTH cookies if user is inactive", async () => {
      req.userId = "user123";
      mockUserFindById.mockResolvedValue({ _id: "user123", isActive: false });

      await getCurrentUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("deviceId", expect.any(Object));
    });

    test("getMe should clear BOTH cookies if user is missing", async () => {
      req.userId = "user123";
      mockUserFindById.mockResolvedValue(null);

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("deviceId", expect.any(Object));
    });
  });
});
