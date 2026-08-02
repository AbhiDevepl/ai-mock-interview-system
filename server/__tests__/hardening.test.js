import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/user.model.js';
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

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
const { googleAuth, getMe, refreshAuth } = await import('../controllers/auth.controller.js');
const { getCurrentUser } = await import('../controllers/user.controller.js');
const { generateQuestion, analyzeResume } = await import('../controllers/interview.controller.js');

const app = express();
app.use(express.json());

// Set up middleware to parse cookies for tests
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Custom auth mock middleware for testing specific endpoints
app.use((req, res, next) => {
  // Bind userId from header or cookies if present to simulate auth middleware
  if (req.headers['x-user-id']) {
    req.userId = req.headers['x-user-id'];
  }
  next();
});

app.post('/api/auth/google', googleAuth);
app.get('/api/auth/me', getMe);
app.post('/api/auth/refresh', refreshAuth);
app.get('/api/user/current-user', getCurrentUser);
app.post('/api/interview/generate-question', generateQuestion);

// Mock a simple file upload route for analyzeResume
import multer from 'multer';
const upload = multer({ dest: 'public/' });
app.post('/api/resume/analyze', upload.single('resume'), analyzeResume);

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

  it('should reject deactivated users on getCurrentUser endpoint and clear cookies', async () => {
    const user = await User.create({
      name: 'Banned User',
      email: 'banned@example.com',
      isActive: false,
    });

    const response = await request(app)
      .get('/api/user/current-user')
      .set('x-user-id', user._id.toString())
      .set('Cookie', ['token=mock-token']);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required.');

    // Assert cookie clearing headers are present in response
    const cookieHeaders = response.headers['set-cookie'];
    expect(cookieHeaders).toBeDefined();
    expect(cookieHeaders.some(c => c.includes('token=;'))).toBe(true);
    expect(cookieHeaders.some(c => c.includes('refreshToken=;'))).toBe(true);
    expect(cookieHeaders.some(c => c.includes('deviceId=;'))).toBe(true);
  });

  it('should reject deactivated users on generate-question endpoint with 403', async () => {
    const user = await User.create({
      name: 'Banned User',
      email: 'banned@example.com',
      isActive: false,
    });

    const response = await request(app)
      .post('/api/interview/generate-question')
      .set('x-user-id', user._id.toString())
      .send({
        role: 'Software Engineer',
        experience: '3 years',
        mode: 'Technical'
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
  });

  it('should reject deactivated users on analyzeResume endpoint, clear files and return 403', async () => {
    const user = await User.create({
      name: 'Banned User',
      email: 'banned@example.com',
      isActive: false,
    });

    // Create a dummy file to simulate resume upload
    const dummyPath = path.join('public', 'test-resume-deactivated.pdf');
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public');
    }
    fs.writeFileSync(dummyPath, 'dummy pdf content');

    const unlinkSpy = jest.spyOn(fs, 'unlinkSync');

    const response = await request(app)
      .post('/api/resume/analyze')
      .set('x-user-id', user._id.toString())
      .attach('resume', dummyPath);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');

    // Assert that the file is deleted/unlinked
    expect(unlinkSpy).toHaveBeenCalled();

    // Clean up dummyPath and mock restore
    unlinkSpy.mockRestore();
    if (fs.existsSync(dummyPath)) {
      fs.unlinkSync(dummyPath);
    }
  });

  it('should clear cookies on refreshAuth if the user is deactivated', async () => {
    const user = await User.create({
      name: 'Banned User',
      email: 'banned@example.com',
      isActive: false,
    });

    // Mock verification of refresh token
    const jwt = await import('jsonwebtoken');
    jest.spyOn(jwt.default, 'verify').mockImplementation((token) => {
      return { userId: user._id.toString(), type: 'refresh' };
    });

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=valid-refresh-token']);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required.');

    const cookieHeaders = response.headers['set-cookie'];
    expect(cookieHeaders).toBeDefined();
    expect(cookieHeaders.some(c => c.includes('token=;'))).toBe(true);
    expect(cookieHeaders.some(c => c.includes('refreshToken=;'))).toBe(true);

    jest.restoreAllMocks();
  });
});
