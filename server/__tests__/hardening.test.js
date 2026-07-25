import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/user.model.js';
import { jest } from '@jest/globals';

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
const { generateQuestion, analyzeResume } = await import('../controllers/interview.controller.js');

const app = express();
app.use(express.json());
app.post('/api/auth/google', googleAuth);

// Mock isAuth user binding for current-user and interview endpoints
app.get('/api/user/current-user', (req, res, next) => {
  req.userId = '660000000000000000000001';
  next();
}, getCurrentUser);

app.post('/api/interview/generate-question', (req, res, next) => {
  req.userId = '660000000000000000000001';
  next();
}, generateQuestion);

app.post('/api/interview/resume', (req, res, next) => {
  req.userId = '660000000000000000000001';
  next();
}, (req, res, next) => {
  req.file = { path: 'non-existent-test-resume.pdf' };
  next();
}, analyzeResume);

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

  it('should allow active users to fetch profile', async () => {
    await User.create({
      _id: '660000000000000000000001',
      name: 'Active User',
      email: 'active@example.com',
      isActive: true,
    });

    const response = await request(app)
      .get('/api/user/current-user');

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Active User');
    expect(response.body).not.toHaveProperty('isActive');
    expect(response.body).not.toHaveProperty('firebaseUID');
  });

  it('should reject deactivated users and clear session cookies', async () => {
    await User.create({
      _id: '660000000000000000000001',
      name: 'Deactivated User',
      email: 'deactivated@example.com',
      isActive: false,
    });

    const response = await request(app)
      .get('/api/user/current-user');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required.');

    // Verify session cookies are cleared
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(c => c.includes('token=;'))).toBe(true);
  });
});

describe('AI endpoints account deactivation protection', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should reject deactivated users from generating questions', async () => {
    await User.create({
      _id: '660000000000000000000001',
      name: 'Deactivated User',
      email: 'deactivated@example.com',
      isActive: false,
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
  });

  it('should reject deactivated users from analyzing resumes and handle cleanup', async () => {
    await User.create({
      _id: '660000000000000000000001',
      name: 'Deactivated User',
      email: 'deactivated@example.com',
      isActive: false,
    });

    const response = await request(app)
      .post('/api/interview/resume');

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
  });
});
