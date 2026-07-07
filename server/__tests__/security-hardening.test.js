import { jest } from "@jest/globals";
import { googleAuth } from "../controllers/auth.controller.js";
import { getCurrentUser } from "../controllers/user.controller.js";
import User from "../models/user.model.js";
import { admin } from "../config/firebaseAdmin.js";

process.env.JWT_SECRET = "security-hardening-test-2026";

describe("Security Hardening Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      cookies: {},
      ip: "127.0.0.1",
      get: jest.fn().mockReturnValue("test-agent"),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("googleAuth identity spoofing prevention", () => {
    test("should use name and picture from Firebase token, NOT from request body", async () => {
      const idToken = "valid-firebase-token";
      req.body = {
        idToken,
        name: "Spoofed Name",
        photo: "http://malicious.com/spoofed.jpg"
      };

      const firebaseUser = {
        email: "verified@example.com",
        email_verified: true,
        uid: "firebase-uid-123",
        name: "Verified Name",
        picture: "http://secure.com/verified.jpg"
      };

      jest.spyOn(admin, "auth").mockReturnValue({
        verifyIdToken: jest.fn().mockResolvedValue(firebaseUser)
      });

      // Mock User.findOne to return null (new user)
      jest.spyOn(User, "findOne").mockResolvedValue(null);
      const createSpy = jest.spyOn(User, "create").mockResolvedValue({
        ...firebaseUser,
        _id: "new-user-id",
        role: "user",
        save: jest.fn()
      });

      await googleAuth(req, res);

      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: "Verified Name",
        picture: "http://secure.com/verified.jpg",
        email: "verified@example.com"
      }));
      expect(createSpy).not.toHaveBeenCalledWith(expect.objectContaining({
        name: "Spoofed Name"
      }));
    });
  });

  describe("googleAuth deactivated user rejection", () => {
    test("should reject login for deactivated user with 403 and clear cookies", async () => {
      const idToken = "valid-firebase-token";
      req.body = { idToken };

      const firebaseUser = {
        email: "deactivated@example.com",
        email_verified: true,
        uid: "firebase-uid-456"
      };

      jest.spyOn(admin, "auth").mockReturnValue({
        verifyIdToken: jest.fn().mockResolvedValue(firebaseUser)
      });

      const inactiveUser = {
        _id: "inactive-id",
        email: "deactivated@example.com",
        isActive: false
      };

      jest.spyOn(User, "findOne").mockResolvedValue(inactiveUser);

      await googleAuth(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Your account is deactivated."
      }));
      expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
    });
  });

  describe("getCurrentUser hardening", () => {
    test("should clear cookies and return 401 if user is inactive", async () => {
      req.userId = "inactive-id";
      const inactiveUser = {
        _id: "inactive-id",
        isActive: false
      };

      jest.spyOn(User, "findById").mockResolvedValue(inactiveUser);

      await getCurrentUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
    });
  });
});
