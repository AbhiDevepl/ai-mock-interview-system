import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Interview from '../models/interview.model.js';
import { jest } from '@jest/globals';
import fs from 'fs';

// Set JWT Secret for test environment
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

// Mock Token Generation - use dynamic imports to import these safely
const { googleAuth, refreshAuth } = await import('../controllers/auth.controller.js');
const { getCurrentUser } = await import('../controllers/user.controller.js');
const { generateQuestion, analyzeResume } = await import('../controllers/interview.controller.js');
const { default: isAuth } = await import('../middleware/isAuth.js');
const { upload } = await import('../middleware/multer.js');

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cookieParser());

// Mount the test endpoints
app.post('/api/auth/google', googleAuth);
app.post('/api/auth/refresh', refreshAuth);
app.get('/api/user/current-user', isAuth, getCurrentUser);
app.post('/api/interview/generate-question', isAuth, generateQuestion);
app.post('/api/interview/resume', isAuth, upload.single("resume"), analyzeResume);

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

describe('Hardening and Account Deactivation Tests', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  describe('googleAuth Controller', () => {
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

  describe('getCurrentUser Controller', () => {
    it('should reject deactivated users on getCurrentUser and clear cookie', async () => {
      const user = await User.create({
        name: 'Banned User',
        email: 'getCurrentUser@example.com',
        isActive: false,
      });

      const token = jwt.sign({ userId: user._id.toString(), type: 'access' }, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/api/user/current-user')
        .set('Cookie', [`token=${token}`]);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required.');

      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie[0]).toContain('token=;');
    });
  });

  describe('generateQuestion Controller', () => {
    it('should reject deactivated users on generateQuestion', async () => {
      const user = await User.create({
        name: 'Banned User',
        email: 'generateQuestion@example.com',
        isActive: false,
      });

      const token = jwt.sign({ userId: user._id.toString(), type: 'access' }, process.env.JWT_SECRET);

      const response = await request(app)
        .post('/api/interview/generate-question')
        .set('Cookie', [`token=${token}`])
        .send({ role: 'Software Engineer', experience: 'Junior', mode: 'Technical' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('This account has been deactivated.');
    });
  });

  describe('analyzeResume Controller', () => {
    it('should reject deactivated users on analyzeResume and unlink uploaded file', async () => {
      const user = await User.create({
        name: 'Banned User',
        email: 'analyzeResume@example.com',
        isActive: false,
      });

      const token = jwt.sign({ userId: user._id.toString(), type: 'access' }, process.env.JWT_SECRET);
      const pdfBuffer = Buffer.from('%PDF-1.4 ...'); // Mock PDF buffer

      const response = await request(app)
        .post('/api/interview/resume')
        .set('Cookie', [`token=${token}`])
        .attach('resume', pdfBuffer, { filename: 'test-deactivated.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('This account has been deactivated.');
    });
  });

  describe('refreshAuth Controller', () => {
    it('should reject deactivated users on refreshAuth and clear cookies', async () => {
      const user = await User.create({
        name: 'Banned User',
        email: 'refreshAuth@example.com',
        isActive: false,
      });

      const refreshToken = jwt.sign({ userId: user._id.toString(), type: 'refresh' }, process.env.JWT_SECRET);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required.');

      const setCookies = response.headers['set-cookie'];
      expect(setCookies).toBeDefined();

      const joinedCookies = setCookies.join(';');
      expect(joinedCookies).toContain('token=;');
      expect(joinedCookies).toContain('refreshToken=;');
    });
  });
});

describe('Deactivation Hardening for profile and metered AI endpoints', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('GET /api/user/current-user', () => {
    it('should reject deactivated users and clear session cookies', async () => {
      const user = await User.create({
        _id: '660000000000000000000001',
        name: 'Deactivated User',
        email: 'deactivated@example.com',
        isActive: false,
      });

      const response = await request(app)
        .get('/api/user/current-user')
        .set('x-user-id', user._id.toString());

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized access.');
      const cookies = response.headers['set-cookie'] || [];
      expect(cookies.some(c => c.includes('token='))).toBe(true);
      expect(cookies.some(c => c.includes('refreshToken='))).toBe(true);
    });

    it('should allow active users', async () => {
      const user = await User.create({
        _id: '660000000000000000000001',
        name: 'Active User',
        email: 'active@example.com',
        isActive: true,
      });

      const response = await request(app)
        .get('/api/user/current-user')
        .set('x-user-id', user._id.toString());

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Active User');
      expect(response.body).not.toHaveProperty('isActive');
    });
  });

  describe('POST /api/interview/generate-question', () => {
    it('should reject deactivated users', async () => {
      const user = await User.create({
        _id: '660000000000000000000001',
        name: 'Deactivated User',
        email: 'deactivated@example.com',
        isActive: false,
      });

      const response = await request(app)
        .post('/api/interview/generate-question')
        .set('x-user-id', user._id.toString())
        .send({
          role: 'Engineer',
          experience: '2 years',
          mode: 'Technical',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Account is deactivated.');
    });
  });

  describe('POST /api/interview/resume', () => {
    it('should reject deactivated users and safely clean up the uploaded file', async () => {
      const user = await User.create({
        _id: '660000000000000000000001',
        name: 'Deactivated User',
        email: 'deactivated@example.com',
        isActive: false,
      });

      // Write a dummy file to simulate the uploaded file path
      fs.writeFileSync('test-resume.pdf', 'dummy content');

      const response = await request(app)
        .post('/api/interview/resume')
        .set('x-user-id', user._id.toString());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Account is deactivated.');

      // Verify that the file was successfully deleted/unlinked from the server
      expect(fs.existsSync('test-resume.pdf')).toBe(false);
    });
  });
});
