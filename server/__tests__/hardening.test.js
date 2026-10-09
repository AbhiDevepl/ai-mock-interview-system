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

const mockAskAi = jest.fn();
jest.unstable_mockModule('../services/openRouter.service.js', () => ({
  askAi: mockAskAi,
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

import { upload } from '../middleware/multer.js';

const { googleAuth, refreshAuth } = await import('../controllers/auth.controller.js');
const { getCurrentUser } = await import('../controllers/user.controller.js');
const { generateQuestion, analyzeResume, submitAnswer } = await import('../controllers/interview.controller.js');

const app = express();
app.use(cookieParser());
app.use(express.json());

// Mount endpoints
app.post('/api/auth/google', googleAuth);
app.post('/api/auth/refresh', refreshAuth);

app.get('/api/user/current-user', (req, res, next) => {
  req.userId = req.headers['x-user-id'] || req.query.userId || req.headers['userid'];
  next();
}, getCurrentUser);

const mockIsAuth = (req, res, next) => {
  req.userId = req.headers['x-user-id'] || req.headers['userid'] || 'default-user-id';
  next();
};

app.post('/api/interview/generate-question', mockIsAuth, generateQuestion);
app.post('/api/interview/resume', mockIsAuth, upload.single('resume'), analyzeResume);
app.post('/api/resume/analyze', mockIsAuth, upload.single('resume'), analyzeResume);
app.post('/api/interview/submit-answer', mockIsAuth, submitAnswer);

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key-123';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  const publicDir = 'public';
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
    await Interview.deleteMany({});
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
      const cookies = response.headers['set-cookie'] || [];
      const hasClearedToken = cookies.some(cookie => cookie.includes('token=') && (cookie.includes('1970') || cookie.includes('Max-Age=0') || cookie.includes('expires=')));
      expect(hasClearedToken).toBe(true);
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

  describe('generateQuestion Controller', () => {
    it('should reject deactivated users with 403 Forbidden to protect metered AI APIs', async () => {
      const response = await request(app)
        .post('/api/interview/generate-question')
        .set('x-user-id', deactivatedUserId)
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
      mockAskAi.mockResolvedValue('{"questions": ["Q1", "Q2", "Q3", "Q4", "Q5"]}');

      const response = await request(app)
        .post('/api/interview/generate-question')
        .set('x-user-id', activeUserId)
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
      const buffer = Buffer.from('%PDF-1.4 dummy pdf content');

      const response = await request(app)
        .post('/api/interview/resume')
        .set('x-user-id', deactivatedUserId)
        .attach('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('This account has been deactivated.');
      expect(mockAskAi).not.toHaveBeenCalled();

      const publicDir = 'public';
      const files = fs.readdirSync(publicDir).filter(f => f !== '.gitkeep');
      expect(files.length).toBe(0);
    });

    it('should process resume for active users', async () => {
      const validPdfString = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 712 Td
(John Doe Resume) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000216 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
310
%%EOF`;
      const buffer = Buffer.from(validPdfString);
      mockAskAi.mockResolvedValue('{"role": "Engineer", "experience": "Senior", "projects": [], "skills": []}');

      const response = await request(app)
        .post('/api/interview/resume')
        .set('x-user-id', activeUserId)
        .attach('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(200);
      expect(mockAskAi).toHaveBeenCalled();
    });
  });

  describe('refreshAuth Controller', () => {
    it('should clear cookies and return 401 when refreshToken cookie is invalid or missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required.');
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
