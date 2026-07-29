import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/user.model.js';
import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';

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

// Mock askAi
const mockAskAi = jest.fn();
jest.unstable_mockModule('../services/openRouter.service.js', () => ({
  askAi: mockAskAi,
}));

// NOW IMPORT CONTROLLER AND ROUTERS
const { googleAuth } = await import('../controllers/auth.controller.js');
const userRouter = (await import('../routers/user.route.js')).default;
const interviewRouter = (await import('../routers/interview.route.js')).default;
const resumeRouter = (await import('../routers/resume.route.js')).default;

const app = express();
app.use(express.json());

// Mount routers
app.post('/api/auth/google', googleAuth);
app.use('/api/user', userRouter);
app.use('/api/interview', interviewRouter);
app.use('/api/resume', resumeRouter);

let mongoServer;

beforeAll(async () => {
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

describe('Account Deactivation Hardening', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();

    // Clean public folder
    const directory = 'public';
    if (fs.existsSync(directory)) {
      const files = fs.readdirSync(directory);
      for (const file of files) {
        if (file !== '.gitkeep') {
          try {
            fs.unlinkSync(path.join(directory, file));
          } catch (err) {}
        }
      }
    }
  });

  it('getCurrentUser: should clear token and return 401 for deactivated users', async () => {
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

    // Verify clear-cookie header is set
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(c => c.includes('token=;'))).toBe(true);
  });

  it('generateQuestion: should return 403 and NOT call AI for deactivated users', async () => {
    await User.create({
      _id: '660000000000000000000001',
      name: 'Banned User',
      email: 'banned@example.com',
      isActive: false,
      credits: 100,
    });

    const response = await request(app)
      .post('/api/interview/generate-question')
      .send({
        role: 'Frontend Developer',
        experience: '3 years',
        mode: 'Technical',
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
    expect(mockAskAi).not.toHaveBeenCalled();
  });

  it('analyzeResume: should return 403, clean up files, and NOT call AI for deactivated users', async () => {
    await User.create({
      _id: '660000000000000000000001',
      name: 'Banned User',
      email: 'banned@example.com',
      isActive: false,
    });

    const buffer = Buffer.from('%PDF-1.4 dummy pdf content');
    const response = await request(app)
      .post('/api/resume/analyze')
      .attach('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
    expect(mockAskAi).not.toHaveBeenCalled();

    // Verify that the file was deleted and not left in public/ directory
    const directory = 'public';
    const files = fs.readdirSync(directory).filter(f => f !== '.gitkeep');
    expect(files.length).toBe(0);
  });
});
