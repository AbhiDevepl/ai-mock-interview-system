import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/user.model.js';
import { jest } from '@jest/globals';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// MOCKING FIREBASE BEFORE CONTROLLER IMPORT
jest.unstable_mockModule('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  cert: jest.fn(),
  getApps: jest.fn(() => [{}]),
}));

const mockVerifyIdToken = jest.fn();
jest.unstable_mockModule('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

// Mock Token Generation
jest.unstable_mockModule('../config/token.js', () => ({
  genToken: jest.fn(() => 'mock-token'),
  genAccessToken: jest.fn(() => 'mock-access-token'),
  genRefreshToken: jest.fn(() => 'mock-refresh-token'),
}));

// NOW IMPORT CONTROLLER
const { googleAuth, refreshAuth } = await import('../controllers/auth.controller.js');

const app = express();
app.use(cookieParser());
app.use(express.json());
app.post('/api/auth/google', googleAuth);
app.post('/api/auth/refresh', refreshAuth);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('googleAuth Controller hardening', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  it('should reject deactivated users', async () => {
    const email = 'banned@example.com';
    await User.create({
      name: 'Banned User',
      email,
      isActive: false,
      firebaseUID: 'uid123',
    });

    mockVerifyIdToken.mockResolvedValue({
      email,
      email_verified: true,
      uid: 'uid123',
      name: 'Banned User',
      picture: 'pic.jpg',
    });

    const response = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-token' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
  });

  it('should use name and picture from Firebase token, not request body', async () => {
    mockVerifyIdToken.mockResolvedValue({
      email: 'newuser@example.com',
      email_verified: true,
      uid: 'uid456',
      name: 'Firebase Name',
      picture: 'firebase-pic.jpg',
    });

    const response = await request(app)
      .post('/api/auth/google')
      .send({
        idToken: 'valid-token',
        name: 'Attacker Name',
        photo: 'attacker-pic.jpg'
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Firebase Name');
    expect(response.body.picture).toBe('firebase-pic.jpg');

    const user = await User.findOne({ email: 'newuser@example.com' });
    expect(user.name).toBe('Firebase Name');
    expect(user.picture).toBe('firebase-pic.jpg');
  });
});

describe('refreshAuth Controller hardening', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should successfully rotate tokens for active users', async () => {
    const user = await User.create({
      name: 'Active User',
      email: 'active@example.com',
      isActive: true,
    });

    const refreshToken = jwt.sign(
      { userId: user._id.toString(), type: 'refresh' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Active User');

    // Should set rotated token cookies
    const cookies = response.headers['set-cookie'] || [];
    expect(cookies.some(c => c.includes('token=mock-access-token'))).toBe(true);
    expect(cookies.some(c => c.includes('refreshToken=mock-refresh-token'))).toBe(true);
  });

  it('should reject and clear cookies for deactivated users', async () => {
    const user = await User.create({
      name: 'Deactivated User',
      email: 'inactive@example.com',
      isActive: false,
    });

    const refreshToken = jwt.sign(
      { userId: user._id.toString(), type: 'refresh' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required.');

    // Cookies should be cleared
    const cookies = response.headers['set-cookie'] || [];
    expect(cookies.some(c => c.includes('token=;'))).toBe(true);
    expect(cookies.some(c => c.includes('refreshToken=;'))).toBe(true);
  });

  it('should reject and clear cookies for non-existent users', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const refreshToken = jwt.sign(
      { userId: nonExistentId, type: 'refresh' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required.');

    // Cookies should be cleared
    const cookies = response.headers['set-cookie'] || [];
    expect(cookies.some(c => c.includes('token=;'))).toBe(true);
    expect(cookies.some(c => c.includes('refreshToken=;'))).toBe(true);
  });

  it('should reject if invalid type token is provided', async () => {
    const user = await User.create({
      name: 'Active User',
      email: 'active@example.com',
      isActive: true,
    });

    const invalidTypeToken = jwt.sign(
      { userId: user._id.toString(), type: 'access' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${invalidTypeToken}`]);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required.');
  });
});
