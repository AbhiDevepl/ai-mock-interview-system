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

import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import Interview from '../models/interview.model.js';
import path from 'path';
import fs from 'fs';

// NOW IMPORT CONTROLLER
const { googleAuth } = await import('../controllers/auth.controller.js');
const interviewRouter = (await import('../routers/interview.route.js')).default;

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cookieParser());

app.post('/api/auth/google', googleAuth);
app.use('/api/interview', interviewRouter);

app.use((err, req, res, next) => {
  if (err.message === "Only PDF files are allowed") {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File exceeds the 5MB size limit." });
  }
  return res.status(500).json({ message: "Internal server error." });
});

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

describe('Interview Endpoints hardening for deactivated users', () => {
  let deactivatedUser;
  let token;

  beforeEach(async () => {
    await User.deleteMany({});
    await Interview.deleteMany({});

    deactivatedUser = await User.create({
      name: 'Deactivated User',
      email: 'deactivated@example.com',
      isActive: false,
      firebaseUID: 'uid-deactivated',
    });

    token = jwt.sign(
      { userId: deactivatedUser._id.toString(), role: 'user', type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
  });

  afterAll(() => {
    const directory = 'public';
    if (fs.existsSync(directory)) {
      const files = fs.readdirSync(directory);
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(directory, file));
        }
      }
    }
  });

  it('POST /api/interview/resume should reject deactivated user and clean up uploaded file', async () => {
    const buffer = Buffer.from('%PDF-1.4 dummy pdf content');
    const response = await request(app)
      .post('/api/interview/resume')
      .set('Cookie', [`token=${token}`])
      .attach('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');

    // Confirm file was deleted from the public directory
    const directory = 'public';
    if (fs.existsSync(directory)) {
      const files = fs.readdirSync(directory).filter(f => f !== '.gitkeep');
      expect(files).toHaveLength(0);
    }
  });

  it('POST /api/interview/generate-question should reject deactivated user', async () => {
    const response = await request(app)
      .post('/api/interview/generate-question')
      .set('Cookie', [`token=${token}`])
      .send({
        role: 'Frontend Developer',
        experience: '3 years',
        mode: 'Technical',
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
  });

  it('POST /api/interview/submit-answer should reject deactivated user', async () => {
    const interview = await Interview.create({
      userId: deactivatedUser._id,
      role: 'Frontend Developer',
      experience: '3 years',
      mode: 'Technical',
      questions: [{ question: 'Q1', difficulty: 'easy', timeLimit: 60 }],
    });

    const response = await request(app)
      .post('/api/interview/submit-answer')
      .set('Cookie', [`token=${token}`])
      .send({
        interviewId: interview._id,
        questionIndex: 0,
        answer: 'Valid answer',
        timeTaken: 10,
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('This account has been deactivated.');
  });
});
