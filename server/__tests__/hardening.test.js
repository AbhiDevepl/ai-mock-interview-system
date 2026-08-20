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
const { getCurrentUser } = await import('../controllers/user.controller.js');
const { generateQuestion, analyzeResume } = await import('../controllers/interview.controller.js');
const { upload } = await import('../middleware/multer.js');

const app = express();
app.use(cookieParser());
app.use(express.json());
app.post('/api/auth/google', googleAuth);
app.get('/api/user/current-user', (req, res, next) => {
  req.userId = req.headers['x-user-id'] || 'default-user-id';
  next();
}, getCurrentUser);
app.post('/api/auth/refresh', refreshAuth);
app.post('/api/interview/generate-question', (req, res, next) => {
  req.userId = req.headers['x-user-id'] || 'default-user-id';
  next();
}, generateQuestion);
app.post('/api/interview/resume', (req, res, next) => {
  req.userId = req.headers['x-user-id'] || 'default-user-id';
  next();
}, upload.single('resume'), analyzeResume);

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

  it('should reject deactivated users on getCurrentUser and clear cookies', async () => {
    const user = await User.create({
      name: 'Deactivated User',
      email: 'deactivated@example.com',
      isActive: false,
    });

    const response = await request(app)
      .get('/api/user/current-user')
      .set('x-user-id', user._id.toString());

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized access.');

    // Check that cookies are cleared
    const setCookie = response.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const setCookieStr = setCookie.join(';');
    expect(setCookieStr).toContain('token=');
    expect(setCookieStr).toContain('refreshToken=');
    expect(setCookieStr).toContain('deviceId=');
  });

  it('should return active user profile on getCurrentUser and not leak isActive or firebaseUID', async () => {
    const user = await User.create({
      name: 'Active User',
      email: 'active@example.com',
      isActive: true,
      firebaseUID: 'active-uid-123',
    });

    const response = await request(app)
      .get('/api/user/current-user')
      .set('x-user-id', user._id.toString());

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Active User');
    expect(response.body.email).toBe('active@example.com');
    expect(response.body.isActive).toBeUndefined();
    expect(response.body.firebaseUID).toBeUndefined();
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

describe('Metered Interview Endpoints Deactivation hardening', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should reject generateQuestion for deactivated users', async () => {
    const deactivatedUser = await User.create({
      name: 'Deactivated User',
      email: 'deactivated-questions@example.com',
      isActive: false,
      credits: 100,
    });

    const response = await request(app)
      .post('/api/interview/generate-question')
      .set('x-user-id', deactivatedUser._id.toString())
      .send({
        role: 'Software Engineer',
        experience: '2 years',
        mode: 'Technical',
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
  });

  it('should reject analyzeResume for deactivated users', async () => {
    const deactivatedUser = await User.create({
      name: 'Deactivated User',
      email: 'deactivated-resume@example.com',
      isActive: false,
    });

    const pdfBuffer = Buffer.from('%PDF-1.4 dummy pdf content');

    const response = await request(app)
      .post('/api/interview/resume')
      .set('x-user-id', deactivatedUser._id.toString())
      .attach('resume', pdfBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
  });
});