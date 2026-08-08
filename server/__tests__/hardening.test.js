import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { jest } from '@jest/globals';

// Set test environment secret
process.env.JWT_SECRET = 'test-secret';

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
const { googleAuth } = await import('../controllers/auth.controller.js');
const { getCurrentUser } = await import('../controllers/user.controller.js');
const { default: isAuth } = await import('../middleware/isAuth.js');

const app = express();
app.use(cookieParser());
app.use(express.json());
app.post('/api/auth/google', googleAuth);
app.get('/api/user/current-user', isAuth, getCurrentUser);

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

describe('getCurrentUser Controller hardening', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should successfully return active user details', async () => {
    const user = await User.create({
      name: 'Active User',
      email: 'active@example.com',
      isActive: true,
      credits: 100,
    });

    const token = jwt.sign(
      { userId: user._id.toString(), role: 'user', type: 'access' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256' }
    );

    const response = await request(app)
      .get('/api/user/current-user')
      .set('Cookie', [`token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Active User');
    expect(response.body.id).toBe(user._id.toString());
    expect(response.body.isActive).toBeUndefined(); // ensure isActive is deleted/not-disclosed
  });

  it('should reject deactivated user, clear cookies, and return 401', async () => {
    const user = await User.create({
      name: 'Deactivated User',
      email: 'deactivated@example.com',
      isActive: false,
      credits: 100,
    });

    const token = jwt.sign(
      { userId: user._id.toString(), role: 'user', type: 'access' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256' }
    );

    const response = await request(app)
      .get('/api/user/current-user')
      .set('Cookie', [`token=${token}`]);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('This account has been deactivated.');

    // Verify cookie clearance via Set-Cookie headers
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();

    // Check that cookies are cleared (typically set to empty string and Max-Age=0 or past date)
    const isCleared = (c, name) => {
      const lower = c.toLowerCase();
      return lower.includes(`${name}=`) && (lower.includes('max-age=0') || lower.includes('expires=thu, 01 jan 1970'));
    };

    const tokenCleared = cookies.some(c => isCleared(c, 'token'));
    const refreshTokenCleared = cookies.some(c => isCleared(c, 'refreshtoken'));
    const deviceIdCleared = cookies.some(c => isCleared(c, 'deviceid'));

    expect(tokenCleared).toBe(true);
    expect(refreshTokenCleared).toBe(true);
    expect(deviceIdCleared).toBe(true);
  });
});
