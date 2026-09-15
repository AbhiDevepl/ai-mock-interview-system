import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/user.model.js';
import Interview from '../models/interview.model.js';
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

const publicDir = 'public';

const mockAskAi = jest.fn();
jest.unstable_mockModule('../services/openRouter.service.js', () => ({
  askAi: mockAskAi,
}));

// Mock pdfjs-dist
jest.unstable_mockModule('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn().mockResolvedValue({
        getTextContent: jest.fn().mockResolvedValue({
          items: [{ str: 'Sample resume text' }],
        }),
      }),
    }),
  })),
}));

// Mock isAuth middleware
jest.unstable_mockModule('../middleware/isAuth.js', () => ({
  default: jest.fn((req, res, next) => {
    req.userId = '660000000000000000000001';
    req.userRole = 'user';
    next();
  }),
  optionalAuth: jest.fn((req, res, next) => {
    req.userId = '660000000000000000000001';
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

// Mock Multer upload middleware
import { upload } from '../middleware/multer.js';

// Import routers
const userRouter = (await import('../routers/user.route.js')).default;
const interviewRouter = (await import('../routers/interview.route.js')).default;
const resumeRouter = (await import('../routers/resume.route.js')).default;

// NOW IMPORT CONTROLLER
const { googleAuth, refreshAuth } = await import('../controllers/auth.controller.js');
const { getCurrentUser } = await import('../controllers/user.controller.js');
const { generateQuestion, analyzeResume, submitAnswer } = await import('../controllers/interview.controller.js');

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
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
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
  beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  describe('googleAuth Controller', () => {
    it('should reject deactivated users', async () => {
      await User.create({
        _id: '660000000000000000000001',
        name: 'Banned User',
        email: 'banned@example.com',
        isActive: false,
        firebaseUID: 'uid123',
      });

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
      await User.create({
        _id: '660000000000000000000001',
        name: 'Banned User',
        email: 'banned@example.com',
        isActive: false,
      });

      const response = await request(app)
        .get('/api/user/current-user')
        .set('Cookie', ['token=mock-token']);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required.');
      const cookies = response.headers['set-cookie'] || [];
      expect(cookies.some(c => c.includes('token=;'))).toBe(true);
    });

    it('should successfully return the active user without sensitive or status fields', async () => {
      await User.create({
        _id: '660000000000000000000001',
        name: 'Active User',
        email: 'active@example.com',
        isActive: true,
      });

      const response = await request(app)
        .get('/api/user/current-user')
        .set('Cookie', ['token=mock-token']);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Active User');
      expect(response.body.isActive).toBeUndefined();
      expect(response.body.firebaseUID).toBeUndefined();
    });
  });

  describe('generateQuestion Controller', () => {
    it('should reject deactivated users with 403 Forbidden to protect metered AI APIs', async () => {
      await User.create({
        _id: '660000000000000000000001',
        name: 'Deactivated User',
        email: 'deactivated@example.com',
        isActive: false,
      });

      const response = await request(app)
        .post('/api/interview/generate-question')
        .send({
          role: 'Software Engineer',
          experience: '2 years',
          mode: 'Technical',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('This account has been deactivated.');
      expect(mockAskAi).not.toHaveBeenCalled();
    });

    it('should allow active users to generate questions', async () => {
      await User.create({
        _id: '660000000000000000000001',
        name: 'Active User',
        email: 'active@example.com',
        isActive: true,
        credits: 100,
      });

      mockAskAi.mockResolvedValue('{"questions": ["Q1", "Q2", "Q3", "Q4", "Q5"]}');

      const response = await request(app)
        .post('/api/interview/generate-question')
        .send({
          role: 'Software Engineer',
          experience: '2 years',
          mode: 'Technical',
        });

      expect(response.status).toBe(200);
      expect(mockAskAi).toHaveBeenCalled();
    });
  });

  describe('analyzeResume Controller', () => {
    it('should reject deactivated users with 403, and clean up the uploaded file synchronously', async () => {
      await User.create({
        _id: '660000000000000000000001',
        name: 'Deactivated User',
        email: 'deactivated@example.com',
        isActive: false,
      });

      const buffer = Buffer.from('%PDF-1.4 dummy pdf content');

      const response = await request(app)
        .post('/api/interview/resume')
        .attach('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('This account has been deactivated.');
      expect(mockAskAi).not.toHaveBeenCalled();

      const files = fs.readdirSync(publicDir).filter(f => f !== '.gitkeep');
      expect(files.length).toBe(0);
    });

    it('should process resume for active users', async () => {
      await User.create({
        _id: '660000000000000000000001',
        name: 'Active User',
        email: 'active@example.com',
        isActive: true,
      });

      const buffer = Buffer.from('%PDF-1.4 dummy pdf content');
      mockAskAi.mockResolvedValue('{"role": "Engineer", "experience": "Senior", "projects": [], "skills": []}');

      const response = await request(app)
        .post('/api/interview/resume')
        .attach('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(200);
      expect(mockAskAi).toHaveBeenCalled();
    });
  });

  describe('refreshAuth Controller', () => {
    it('should clear cookies and return 401 when the refreshing user is deactivated', async () => {
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

      const cookies = response.headers['set-cookie'] || [];
      expect(cookies.some(c => c.includes('token=;'))).toBe(true);
      expect(cookies.some(c => c.includes('refreshToken=;'))).toBe(true);
    });

    it('should allow active users to refresh session and set new tokens', async () => {
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

      const cookies = response.headers['set-cookie'] || [];
      expect(cookies.some(c => c.includes('token=mock-access-token'))).toBe(true);
      expect(cookies.some(c => c.includes('refreshToken=mock-refresh-token'))).toBe(true);
    });
  });
});
