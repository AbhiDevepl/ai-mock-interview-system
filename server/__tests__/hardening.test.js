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

// NOW IMPORT CONTROLLER
const { googleAuth, getMe } = await import('../controllers/auth.controller.js');
const { getCurrentUser } = await import('../controllers/user.controller.js');
const { generateQuestion, analyzeResume, submitAnswer } = await import('../controllers/interview.controller.js');

const app = express();
app.use(express.json());

// Set up routes with a middleware that sets a default req.userId
const bindUserMiddleware = (req, res, next) => {
  req.userId = '660000000000000000000001';
  req.userRole = 'user';
  next();
};

app.post('/api/auth/google', googleAuth);
app.get('/api/auth/me', bindUserMiddleware, getMe);
app.get('/api/user/current-user', bindUserMiddleware, getCurrentUser);
app.post('/api/interview/generate-question', bindUserMiddleware, generateQuestion);
app.post('/api/interview/resume', bindUserMiddleware, analyzeResume);
app.post('/api/interview/submit-answer', bindUserMiddleware, submitAnswer);

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

describe('Deactivated users hardening for other endpoints', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('getCurrentUser should deny deactivated users and clear cookies', async () => {
    await User.create({
      _id: '660000000000000000000001',
      name: 'Banned User',
      email: 'banned@example.com',
      isActive: false,
    });

    const response = await request(app)
      .get('/api/user/current-user');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required.');

    // Ensure cookies are cleared by checking the set-cookie header
    const setCookie = response.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const joinedCookie = setCookie.join(';');
    expect(joinedCookie).toContain('token=;');
    expect(joinedCookie).toContain('refreshToken=;');
    expect(joinedCookie).toContain('deviceId=;');
  });

  it('generateQuestion should deny deactivated users', async () => {
    await User.create({
      _id: '660000000000000000000001',
      name: 'Banned User',
      email: 'banned@example.com',
      isActive: false,
    });

    const response = await request(app)
      .post('/api/interview/generate-question')
      .send({
        role: 'Frontend',
        experience: 'Junior',
        mode: 'Technical',
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
  });

  it('analyzeResume should deny deactivated users', async () => {
    await User.create({
      _id: '660000000000000000000001',
      name: 'Banned User',
      email: 'banned@example.com',
      isActive: false,
    });

    const response = await request(app)
      .post('/api/interview/resume');

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
  });

  it('submitAnswer should deny deactivated users', async () => {
    await User.create({
      _id: '660000000000000000000001',
      name: 'Banned User',
      email: 'banned@example.com',
      isActive: false,
    });

    const response = await request(app)
      .post('/api/interview/submit-answer')
      .send({
        interviewId: '660000000000000000000002',
        questionIndex: 0,
        answer: 'Hello',
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
  });
});
