import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/user.model.js';
import Interview from '../models/interview.model.js';
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const publicDir = 'public';

// Mock isAuth middleware BEFORE imports
jest.unstable_mockModule('../middleware/isAuth.js', () => ({
  default: jest.fn((req, res, next) => {
    req.userId = req.headers['x-user-id'] || '660000000000000000000001';
    req.userRole = 'user';
    next();
  }),
  optionalAuth: jest.fn((req, res, next) => {
    req.userId = req.headers['x-user-id'] || '660000000000000000000001';
    req.userRole = 'user';
    next();
  }),
}));

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

const mockAskAi = jest.fn();
jest.unstable_mockModule('../services/openRouter.service.js', () => ({
  askAi: mockAskAi,
}));

// DYNAMIC IMPORTS AFTER MOCKS
const { upload } = await import('../middleware/multer.js');
const { googleAuth, refreshAuth } = await import('../controllers/auth.controller.js');
const { getCurrentUser } = await import('../controllers/user.controller.js');
const { generateQuestion, analyzeResume, submitAnswer } = await import('../controllers/interview.controller.js');
const userRouter = (await import('../routers/user.route.js')).default;
const interviewRouter = (await import('../routers/interview.route.js')).default;
const resumeRouter = (await import('../routers/resume.route.js')).default;

const app = express();
app.use(cookieParser());
app.use(express.json());

// Mount routers
app.post('/api/auth/google', googleAuth);
app.post('/api/auth/refresh', refreshAuth);
app.use('/api/user', userRouter);
app.use('/api/interview', interviewRouter);
app.use('/api/resume', resumeRouter);

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key-123';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  // Clean up any test PDF files in public
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    for (const file of files) {
      if (file !== '.gitkeep') {
        try {
          fs.unlinkSync(path.join(publicDir, file));
        } catch {}
      }
    }
  }
});

describe('Security Hardening Deactivation Tests', () => {
  let deactivatedUserId;
  let activeUserId;

  beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();

    const deactivatedUser = await User.create({
      _id: '660000000000000000000001',
      name: 'Banned User',
      email: 'banned@example.com',
      isActive: false,
      firebaseUID: 'uid123',
    });
    deactivatedUserId = deactivatedUser._id.toString();

    const activeUser = await User.create({
      _id: '660000000000000000000002',
      name: 'Active User',
      email: 'active@example.com',
      isActive: true,
      credits: 100,
    });
    activeUserId = activeUser._id.toString();
  });

  describe('googleAuth Controller', () => {
    it('should reject deactivated users', async () => {
      mockVerifyIdToken.mockResolvedValue({
        email: 'banned@example.com',
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

  describe('getCurrentUser Controller', () => {
    it('should reject deactivated users, clear session cookie, and return 401', async () => {
      const response = await request(app)
        .get('/api/user/current-user')
        .set('x-user-id', deactivatedUserId);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required.');
    });

    it('should successfully return the active user without sensitive or status fields', async () => {
      const response = await request(app)
        .get('/api/user/current-user')
        .set('x-user-id', activeUserId);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Active User');
      expect(response.body.isActive).toBeUndefined();
      expect(response.body.firebaseUID).toBeUndefined();
    });
  });

  describe('refreshAuth Controller', () => {
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

      const cookies = response.headers['set-cookie'] || [];
      expect(cookies.some(c => c.includes('token=;'))).toBe(true);
      expect(cookies.some(c => c.includes('refreshToken=;'))).toBe(true);
    });

    it('should allow active users to refresh session and set new tokens', async () => {
      const refreshToken = jwt.sign(
        { userId: activeUserId, type: 'refresh' },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Active User');

      const cookies = response.headers['set-cookie'] || [];
      const hasToken = cookies.some(cookie => cookie.includes('token=') && !cookie.includes('token=;'));
      const hasRefreshToken = cookies.some(cookie => cookie.includes('refreshToken=') && !cookie.includes('refreshToken=;'));
      expect(hasToken).toBe(true);
      expect(hasRefreshToken).toBe(true);
    });
  });
});
