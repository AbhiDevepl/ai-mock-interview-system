import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Use a simple mock strategy for now as ESM mocking in Jest can be tricky
const mockVerifyIdToken = jest.fn();
const mockUserFindOne = jest.fn();
const mockUserCreate = jest.fn();
const mockGenToken = jest.fn();

jest.unstable_mockModule('../config/firebaseAdmin.js', () => ({
  default: {
    auth: () => ({
      verifyIdToken: mockVerifyIdToken,
    }),
  },
}));

jest.unstable_mockModule('../models/user.model.js', () => ({
  default: {
    findOne: mockUserFindOne,
    create: mockUserCreate,
  },
}));

jest.unstable_mockModule('../config/token.js', () => ({
  default: mockGenToken,
}));

// Dynamic imports to ensure mocks are used
const { googleAuth } = await import('../controllers/auth.controller.js');

const app = express();
app.use(express.json());
app.post('/api/auth/google', googleAuth);

describe('googleAuth controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if idToken is missing', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('ID Token is required');
  });

  it('should verify the token and return user data', async () => {
    const mockDecodedToken = {
      email: 'test@example.com',
      name: 'Test User',
    };
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
    };

    mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
    mockUserFindOne.mockResolvedValue(mockUser);
    mockGenToken.mockReturnValue('mockJwtToken');

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-token' });

    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should create a new user if not found', async () => {
    const mockDecodedToken = {
      email: 'new@example.com',
      name: 'New User',
    };
    const mockNewUser = {
      _id: 'user456',
      email: 'new@example.com',
      name: 'New User',
    };

    mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue(mockNewUser);
    mockGenToken.mockReturnValue('mockJwtToken');

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'new-token' });

    expect(mockUserCreate).toHaveBeenCalledWith({
      name: 'New User',
      email: 'new@example.com',
    });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('new@example.com');
  });

  it('should return 500 if token verification fails', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'invalid-token' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
  });
});
