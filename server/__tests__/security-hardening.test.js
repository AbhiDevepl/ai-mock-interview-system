import { jest } from "@jest/globals";
import { googleAuth } from "../controllers/auth.controller.js";
import User from "../models/user.model.js";
import { admin } from "../config/firebaseAdmin.js";
import mongoose from "mongoose";

process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

describe("Security Hardening: Identity Spoofing & Deactivation Bypass", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { idToken: "valid-token" },
      ip: "127.0.0.1",
      connection: { remoteAddress: "127.0.0.1" },
      get: jest.fn().mockReturnValue("Mozilla/5.0"),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    jest.clearAllMocks();

    if (!admin.auth.mock) {
      jest.spyOn(admin, "auth").mockReturnValue({
        verifyIdToken: jest.fn()
      });
    }
  });

  test("googleAuth should prioritize Firebase claims over request body to prevent spoofing", async () => {
    const userId = new mongoose.Types.ObjectId();
    const firebaseUser = {
      email: "victim@example.com",
      email_verified: true,
      uid: "firebase-uid",
      name: "Verified Name",
      picture: "https://verified-photo.com/img.png",
    };

    admin.auth().verifyIdToken.mockResolvedValue(firebaseUser);

    jest.spyOn(User, "findOne").mockResolvedValue(null);
    const createSpy = jest.spyOn(User, "create").mockResolvedValue({
      ...firebaseUser,
      _id: userId,
      role: "user",
      save: jest.fn(),
    });

    req.body.name = "Spoofed Name";
    req.body.photo = "https://malicious.com/spoof.png";

    await googleAuth(req, res);

    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
      name: "Verified Name",
      picture: "https://verified-photo.com/img.png",
    }));
  });

  test("googleAuth should reject deactivated users with 403", async () => {
    const firebaseUser = {
      email: "banned@example.com",
      email_verified: true,
      uid: "banned-uid",
      name: "Banned User",
    };

    admin.auth().verifyIdToken.mockResolvedValue(firebaseUser);

    const deactivatedUser = {
      _id: new mongoose.Types.ObjectId(),
      email: "banned@example.com",
      isActive: false,
      role: "user",
    };
    jest.spyOn(User, "findOne").mockResolvedValue(deactivatedUser);

    await googleAuth(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringMatching(/deactivated/i)
    }));
  });
});
