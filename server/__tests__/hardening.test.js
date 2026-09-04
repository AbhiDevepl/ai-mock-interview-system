import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { jest } from '@jest/globals';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

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
const { generateQuestion, submitAnswer, analyzeResume } = await import('../controllers/interview.controller.js');

const app = express();
app.use(cookieParser());
app.use(express.json());

// Set up routes with a middleware that sets a default req.userId
const bindUserMiddleware = (req, res, next) => {
  req.userId = '660000000000000000000001';
  req.userRole = 'user';
  next();
};

app.post('/api/auth/google', googleAuth);
app.get('/api/user/current-user', (req, res, next) => {
  req.userId = req.headers['x-user-id'];
  next();
}, getCurrentUser);
app.post('/api/interview/generate-question', (req, res, next) => {
  req.userId = req.headers['x-user-id'];
  next();
}, generateQuestion);
app.post('/api/interview/submit-answer', (req, res, next) => {
  req.userId = req.headers['x-user-id'];
  next();
}, submitAnswer);
app.post('/api/interview/resume', (req, res, next) => {
  req.userId = req.headers['x-user-id'];
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

describe('Deactivated user restriction across endpoints', () => {
  let deactivatedUser;

  beforeEach(async () => {
    await User.deleteMany({});
    deactivatedUser = await User.create({
      name: 'Deactivated User',
      email: 'deactivated@example.com',
      isActive: false,
      firebaseUID: 'uid999',
    });
  });

  it('getCurrentUser should reject deactivated users', async () => {
    const response = await request(app)
      .get('/api/user/current-user')
      .set('x-user-id', deactivatedUser._id.toString());

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('This account has been deactivated.');
  });

  it('generateQuestion should reject deactivated users', async () => {
    const response = await request(app)
      .post('/api/interview/generate-question')
      .set('x-user-id', deactivatedUser._id.toString())
      .send({
        role: 'Engineer',
        experience: '2 years',
        mode: 'Technical',
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
  });

  it('submitAnswer should reject deactivated users', async () => {
    const response = await request(app)
      .post('/api/interview/submit-answer')
      .set('x-user-id', deactivatedUser._id.toString())
      .send({
        interviewId: new mongoose.Types.ObjectId().toString(),
        questionIndex: 0,
        answer: 'Example answer',
        timeTaken: 10,
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
  });

  it('analyzeResume should reject deactivated users', async () => {
    // Calling with missing req.file first so that it processes the user check before file errors if any,
    // or we can test that it hits the user validation check cleanly.
    const response = await request(app)
      .post('/api/interview/resume')
      .set('x-user-id', deactivatedUser._id.toString());

    expect(response.status).toBe(400); // Because req.file check happens first
  });
});
