import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/user.model.js';
import Interview from '../models/interview.model.js';
import { jest } from '@jest/globals';

const mockAskAi = jest.fn();
jest.unstable_mockModule('../services/openRouter.service.js', () => ({
  askAi: mockAskAi,
}));

jest.unstable_mockModule('../middleware/isAuth.js', () => ({
  default: jest.fn((req, res, next) => {
    req.userId = '660000000000000000000001';
    req.userRole = 'user';
    next();
  }),
}));

const interviewRouter = (await import('../routers/interview.route.js')).default;

const app = express();
app.use(express.json());
app.use('/api/interview', interviewRouter);

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

describe('Interview Controller Hardening & Validation', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Interview.deleteMany({});
    jest.clearAllMocks();
  });

  describe('POST /api/interview/generate-question', () => {
    it('should allow valid generation with standard inputs and map mode', async () => {
      await User.create({
        _id: '660000000000000000000001',
        name: 'John Doe',
        email: 'john@example.com',
        credits: 100,
      });

      mockAskAi.mockResolvedValue('Q1\nQ2\nQ3\nQ4\nQ5');

      const response = await request(app)
        .post('/api/interview/generate-question')
        .send({
          role: 'Frontend Developer',
          experience: '3 years',
          mode: 'Behavioral', // Maps to 'HR' in DB
          projects: ['Project A'],
          skills: ['React'],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('interviewId');
      expect(response.body.questions).toHaveLength(5);
      expect(response.body.creditLeft).toBe(50);

      const saved = await Interview.findById(response.body.interviewId);
      expect(saved).toBeDefined();
      expect(saved.mode).toBe('HR'); // Check mapping
    });

    it('should reject invalid or missing fields', async () => {
      const response = await request(app)
        .post('/api/interview/generate-question')
        .send({
          role: '',
          experience: '3 years',
          mode: 'Behavioral',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Role is required');
    });

    it('should reject extremely long role/experience to prevent prompt injection/DoS', async () => {
      const response = await request(app)
        .post('/api/interview/generate-question')
        .send({
          role: 'a'.repeat(101),
          experience: '3 years',
          mode: 'Technical',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('under 100 characters');
    });

    it('should reject invalid projects/skills arrays', async () => {
      const response = await request(app)
        .post('/api/interview/generate-question')
        .send({
          role: 'Frontend',
          experience: '3 years',
          mode: 'Technical',
          projects: 'not-an-array',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Projects must be an array');
    });
  });

  describe('POST /api/interview/submit-answer', () => {
    it('should reject malformed interview ID', async () => {
      const response = await request(app)
        .post('/api/interview/submit-answer')
        .send({
          interviewId: 'invalid-id-format',
          questionIndex: 0,
          answer: 'Test answer',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid interview ID format.');
    });

    it('should reject missing or invalid questionIndex', async () => {
      const interview = await Interview.create({
        userId: '660000000000000000000001',
        role: 'Frontend',
        experience: 'Junior',
        mode: 'Technical',
        questions: [{ question: 'Q1', difficulty: 'easy', timeLimit: 60 }],
      });

      const response = await request(app)
        .post('/api/interview/submit-answer')
        .send({
          interviewId: interview._id,
          questionIndex: 5, // out of bounds
          answer: 'Test answer',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid question index.');
    });

    it('should reject non-string answer', async () => {
      const interview = await Interview.create({
        userId: '660000000000000000000001',
        role: 'Frontend',
        experience: 'Junior',
        mode: 'Technical',
        questions: [{ question: 'Q1', difficulty: 'easy', timeLimit: 60 }],
      });

      const response = await request(app)
        .post('/api/interview/submit-answer')
        .send({
          interviewId: interview._id,
          questionIndex: 0,
          answer: { text: 'object answer' },
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Answer must be a string.');
    });
  });

  describe('POST /api/interview/finish', () => {
    it('should reject malformed interview ID', async () => {
      const response = await request(app)
        .post('/api/interview/finish')
        .send({
          interviewId: 'invalid-id-format',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid interview ID format.');
    });
  });
});
