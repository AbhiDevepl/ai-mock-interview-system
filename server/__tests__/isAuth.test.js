import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import isAuth from '../middleware/isAuth.js';

const app = express();
app.use(cookieParser());
app.use(express.json());

process.env.JWT_SECRET = 'test-secret';

app.get('/test-auth', isAuth, (req, res) => {
  res.status(200).json({ userId: req.userId });
});

describe('isAuth Middleware', () => {
  it('should return 401 if no token is provided', async () => {
    const response = await request(app).get('/test-auth');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized access.');
  });

  it('should return 401 if an invalid token is provided', async () => {
    const response = await request(app)
      .get('/test-auth')
      .set('Cookie', ['token=invalid-token']);
    expect(response.status).toBe(401);
  });

  it('should return 200 and bind userId if a valid access token is provided', async () => {
    const token = jwt.sign({ userId: 'user123', type: 'access' }, process.env.JWT_SECRET);
    const response = await request(app)
      .get('/test-auth')
      .set('Cookie', [`token=${token}`]);
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe('user123');
  });

  it('should return 401 if a refresh token is used as an access token', async () => {
    const token = jwt.sign({ userId: 'user123', type: 'refresh' }, process.env.JWT_SECRET);
    const response = await request(app)
      .get('/test-auth')
      .set('Cookie', [`token=${token}`]);
    expect(response.status).toBe(401);
  });
});
