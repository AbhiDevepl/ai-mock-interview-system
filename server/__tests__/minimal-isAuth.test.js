import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";
import isAuth from "../middleware/isAuth.js";

process.env.JWT_SECRET = "test-secret";

describe("isAuth middleware", () => {
  it("should fail if no token is provided", async () => {
    const req = { cookies: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await isAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized access." });
    expect(next).not.toHaveBeenCalled();
  });

  it("should succeed if a valid token is provided", async () => {
    const userId = "user123";
    const token = jwt.sign({ userId, role: "user" }, process.env.JWT_SECRET);
    const req = { cookies: { token } };
    const res = {};
    const next = jest.fn();

    await isAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe(userId);
    expect(req.userRole).toBe("user");
  });

  it("should fail if token is invalid", async () => {
    const req = { cookies: { token: "invalid-token" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await isAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
