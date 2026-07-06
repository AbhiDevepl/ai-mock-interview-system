import { jest } from "@jest/globals";
import { googleAuth } from "../controllers/auth.controller.js";
import { getCurrentUser } from "../controllers/user.controller.js";
import isAuth from "../middleware/isAuth.js";
import User from "../models/user.model.js";
import { admin } from "../config/firebaseAdmin.js";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-secret";

describe("Security Hardening Tests", () => {
  let mockRes;
  let mockReq;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    mockReq = {
      body: {},
      cookies: {},
      ip: "127.0.0.1",
      get: jest.fn().mockReturnValue("test-agent"),
    };
    jest.clearAllMocks();
  });

  test("googleAuth should reject deactivated users and not re-activate them", async () => {
    const deactivatedUser = {
      _id: "user123",
      email: "banned@example.com",
      isActive: false,
      save: jest.fn(),
    };

    jest.spyOn(User, "findOne").mockResolvedValue(deactivatedUser);

    // Mock Firebase verification
    const mockVerifyIdToken = jest.fn().mockResolvedValue({
      email: "banned@example.com",
      email_verified: true,
      uid: "firebase123",
    });

    // Ponytail: Mock firebase admin auth
    jest.spyOn(admin, "auth").mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });

    mockReq.body = { idToken: "valid-token" };

    await googleAuth(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Account deactivated. Please contact support." })
    );
    expect(deactivatedUser.save).not.toHaveBeenCalled();
  });

  test("googleAuth should use identity claims from verified Firebase token", async () => {
    const newUserEmail = "new@example.com";
    const validId = "60d5ecdec013ef0015f8e58a"; // Valid ObjectId string
    jest.spyOn(User, "findOne").mockResolvedValue(null);
    const mockCreate = jest.spyOn(User, "create").mockResolvedValue({
      _id: validId,
      email: newUserEmail,
      role: "user",
      isActive: true,
    });

    const mockVerifyIdToken = jest.fn().mockResolvedValue({
      email: newUserEmail,
      email_verified: true,
      uid: "firebase123",
      name: "Verified Name",
      picture: "https://verified.com/photo.jpg",
    });

    jest.spyOn(admin, "auth").mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });

    mockReq.body = {
        idToken: "valid-token",
        name: "Spoofed Name",
        photo: "https://spoofed.com/photo.jpg"
    };

    await googleAuth(mockReq, mockRes);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      name: "Verified Name",
      picture: "https://verified.com/photo.jpg"
    }));
  });

  test("isAuth should clear both cookies on token type mismatch", async () => {
    const refreshToken = jwt.sign({ userId: "u123", type: "refresh" }, process.env.JWT_SECRET);
    mockReq.cookies.token = refreshToken;
    const next = jest.fn();

    await isAuth(mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
    expect(next).not.toHaveBeenCalled();
  });

  test("getCurrentUser should clear both cookies if user is deactivated", async () => {
    mockReq.userId = "user123";
    jest.spyOn(User, "findById").mockResolvedValue({
      _id: "user123",
      isActive: false
    });

    await getCurrentUser(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
    expect(mockRes.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
  });
});
