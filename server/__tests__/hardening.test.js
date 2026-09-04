import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Interview from '../models/interview.model.js';
import { jest } from '@jest/globals';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { upload } from '../middleware/multer.js';

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

// NOW IMPORT CONTROLLERS
const { googleAuth } = await import('../controllers/auth.controller.js');
const { getCurrentUser } = await import('../controllers/user.controller.js');

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cookieParser());

app.post('/api/auth/google', googleAuth);
app.get('/api/user/current-user', (req, res, next) => {
  req.userId = '660000000000000000000002';
  next();
}, getCurrentUser);

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key-123';
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
    jest.clearAllMocks();
  });

  it('should return 200 and sanitized user details for active users', async () => {
    await User.create({
      _id: '660000000000000000000002',
      name: 'Active User',
      email: 'active@example.com',
      isActive: true,
    });

    const response = await request(app)
      .get('/api/user/current-user');

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Active User');
    expect(response.body.id).toBe('660000000000000000000002');
    expect(response.body.isActive).toBeUndefined();
    expect(response.body.firebaseUID).toBeUndefined();
  });

  it('should reject deactivated users and clear token cookie', async () => {
    await User.create({
      _id: '660000000000000000000002',
      name: 'Deactivated User',
      email: 'deactivated@example.com',
      isActive: false,
    });

    const response = await request(app)
      .get('/api/user/current-user');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required.');

    // Verify cookie deletion in response headers
    const setCookie = response.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toContain('token=;');
  });
});
