import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/user.model.js';
import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

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
app.use(cookieParser());
app.use(express.json());

// Mount routers
app.post('/api/auth/google', googleAuth);
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
  let deactivatedUserId;
  let activeUserId;

  beforeEach(async () => {
    await User.deleteMany({});
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
        .set('userid', deactivatedUserId);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized access.');
      // Verify that the JWT session cookie is cleared
      const cookies = response.headers['set-cookie'] || [];
      const hasClearedToken = cookies.some(cookie => cookie.includes('token=') && (cookie.includes('1970') || cookie.includes('Max-Age=0') || cookie.includes('expires=')));
      expect(hasClearedToken).toBe(true);
    });

    it('should successfully return the active user without sensitive or status fields', async () => {
      const response = await request(app)
        .get('/api/user/current-user')
        .set('userid', activeUserId);

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
        .set('userid', deactivatedUserId)
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
        .set('userid', activeUserId)
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
        .set('userid', deactivatedUserId)
        .attach('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('This account has been deactivated.');
      expect(mockAskAi).not.toHaveBeenCalled();

      // Check public directory - there should be no file lingering around
      const files = fs.readdirSync(publicDir).filter(f => f !== '.gitkeep');
      expect(files.length).toBe(0);
    });

    it('should process resume for active users', async () => {
      const buffer = Buffer.from('%PDF-1.4 dummy pdf content');
      mockAskAi.mockResolvedValue('{"role": "Engineer", "experience": "Senior", "projects": [], "skills": []}');

      const response = await request(app)
        .post('/api/interview/resume')
        .set('userid', activeUserId)
        .attach('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(200);
      expect(mockAskAi).toHaveBeenCalled();
    });
  });

  describe('refreshAuth Controller', () => {
    it('should clear cookies and return 401 when the refreshing user is deactivated', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=deactivated-refresh-token']);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required.');

      const cookies = response.headers['set-cookie'] || [];
      const hasClearedToken = cookies.some(cookie => cookie.includes('token=') && (cookie.includes('1970') || cookie.includes('Max-Age=0') || cookie.includes('expires=')));
      const hasClearedRefreshToken = cookies.some(cookie => cookie.includes('refreshToken=') && (cookie.includes('1970') || cookie.includes('Max-Age=0') || cookie.includes('expires=')));
      expect(hasClearedToken).toBe(true);
      expect(hasClearedRefreshToken).toBe(true);
    });

    it('should allow active users to refresh session and set new tokens', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=valid-refresh-token']);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Active User');

      const cookies = response.headers['set-cookie'] || [];
      const hasToken = cookies.some(cookie => cookie.includes('token=') && !cookie.includes('token=;'));
      const hasRefreshToken = cookies.some(cookie => cookie.includes('refreshToken=') && !cookie.includes('refreshToken=;'));
      expect(hasToken).toBe(true);
      expect(hasRefreshToken).toBe(true);
    });
  });

  describe('getCurrentUser Controller hardening', () => {
    it('should reject deactivated users and clear session cookie', async () => {
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

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('token=;'))).toBe(true);
      expect(cookies.some(c => c.includes('refreshToken=;'))).toBe(true);
    });

    it('should allow active users', async () => {
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
      expect(response.body.isActive).toBeUndefined();
    });
  });

  describe('generateQuestion Controller deactivation hardening', () => {
    it('should reject deactivated users with 403', async () => {
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
          experience: 'Senior',
          mode: 'Technical',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('This account has been deactivated.');
    });
  });

  describe('analyzeResume Controller deactivation hardening', () => {
    it('should reject deactivated users with 403', async () => {
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
