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

    // Create default active user to ensure checks pass
    await User.create({
      _id: '660000000000000000000001',
      name: 'Default User',
      email: 'default@example.com',
      isActive: true,
      credits: 100,
    });
  });

  describe('POST /api/interview/resume', () => {
    it('should reject deactivated users with 403 Forbidden and delete the uploaded file', async () => {
      await User.deleteMany({});
      await User.create({
        _id: '660000000000000000000001',
        name: 'Banned User',
        email: 'banned@example.com',
        isActive: false,
      });

      const buffer = Buffer.from('%PDF-1.4 dummy pdf content');
      const response = await request(app)
        .post('/api/interview/resume')
        .attach('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('This account has been deactivated.');
    });

    it('should reject nonexistent users with 404 Not Found and delete the uploaded file', async () => {
      await User.deleteMany({});

      const buffer = Buffer.from('%PDF-1.4 dummy pdf content');
      const response = await request(app)
        .post('/api/interview/resume')
        .attach('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found.');
    });
  });

  describe('POST /api/interview/generate-question', () => {
    it('should allow valid generation with standard inputs and map mode', async () => {
      await User.deleteMany({});
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

    it('should reject deactivated users with 403 Forbidden', async () => {
      await User.deleteMany({});
      await User.create({
        _id: '660000000000000000000001',
        name: 'Banned User',
        email: 'banned@example.com',
        isActive: false,
      });

      const response = await request(app)
        .post('/api/interview/generate-question')
        .send({
          role: 'Frontend Developer',
          experience: '3 years',
          mode: 'Behavioral',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('This account has been deactivated.');
    });

    it('should reject nonexistent users with 404 Not Found', async () => {
      await User.deleteMany({});

      const response = await request(app)
        .post('/api/interview/generate-question')
        .send({
          role: 'Frontend Developer',
          experience: '3 years',
          mode: 'Behavioral',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found.');
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
    it('should reject deactivated users with 403 Forbidden', async () => {
      await User.deleteMany({});
      await User.create({
        _id: '660000000000000000000001',
        name: 'Banned User',
        email: 'banned@example.com',
        isActive: false,
      });

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
          answer: 'Test answer',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('This account has been deactivated.');
    });

    it('should reject nonexistent users with 404 Not Found', async () => {
      await User.deleteMany({});

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
          answer: 'Test answer',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found.');
    });

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

    it('should reject extremely long answer (over 5000 characters) to prevent DoS', async () => {
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
          answer: 'a'.repeat(5001),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Answer must be a string under 5000 characters.');
    });

    it('should successfully submit and securely sanitize and parse the AI response', async () => {
      const interview = await Interview.create({
        userId: '660000000000000000000001',
        role: 'Frontend',
        experience: 'Junior',
        mode: 'Technical',
        questions: [{ question: 'Q1', difficulty: 'easy', timeLimit: 60 }],
      });

      // Mock LLM returning Markdown-wrapped JSON with potentially unsafe values (out of bounds, HTML tags)
      mockAskAi.mockResolvedValue(`
        \`\`\`json
        {
          "confidence": "12",
          "communication": -2,
          "correctness": 8.5,
          "finalScore": "9",
          "feedback": "<script>alert('xss')</script>Good try!"
        }
        \`\`\`
      `);

      const response = await request(app)
        .post('/api/interview/submit-answer')
        .send({
          interviewId: interview._id,
          questionIndex: 0,
          answer: 'Valid answer',
          timeTaken: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('feedback');
      expect(response.body).toHaveProperty('score');

      // Check database state to confirm validation, clamping, and sanitization were correctly performed
      const savedInterview = await Interview.findById(interview._id);
      const q = savedInterview.questions[0];
      expect(q.confidence).toBe(10); // Clamped 12 -> 10
      expect(q.communication).toBe(0); // Clamped -2 -> 0
      expect(q.correctness).toBe(9); // Rounded 8.5 -> 9
      expect(q.score).toBe(9); // Correct score parsed as number
      expect(q.feedback).not.toContain('<script>'); // Stripped < and > tags
      expect(q.feedback).toContain('alert(\'xss\')'); // Safe raw text remaining
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

    it('should successfully finish the interview and calculate the scores', async () => {
      const interview = await Interview.create({
        userId: '660000000000000000000001',
        role: 'Frontend',
        experience: 'Junior',
        mode: 'Technical',
        questions: [
          {
            question: 'Q1',
            difficulty: 'easy',
            timeLimit: 60,
            score: 8,
            confidence: 9,
            communication: 7,
            correctness: 8,
          },
          {
            question: 'Q2',
            difficulty: 'medium',
            timeLimit: 90,
            score: 6,
            confidence: 7,
            communication: 5,
            correctness: 6,
          },
        ],
      });

      const response = await request(app)
        .post('/api/interview/finish')
        .send({
          interviewId: interview._id,
        });

      expect(response.status).toBe(200);
      expect(response.body.finalScore).toBe('7.0');
      expect(response.body.confidence).toBe('8.0');
      expect(response.body.communication).toBe('6.0');
      expect(response.body.correctness).toBe('7.0');
      expect(response.body.questionWiseScore).toHaveLength(2);
      expect(response.body.questionWiseScore[0]).toHaveProperty('score');
      expect(response.body.questionWiseScore[0]).toHaveProperty('difficulty');

      const updated = await Interview.findById(interview._id).lean();
      expect(updated.status).toBe('complete');
      expect(updated.finalScore).toBe(7);
    });
  });
});
