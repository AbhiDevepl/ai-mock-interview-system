import request from 'supertest';
import express from 'express';
import { sessionLimiter } from '../middleware/rateLimiter.js';
import { jest } from '@jest/globals';

const app = express();
app.set('trust proxy', 1); // For express-rate-limit to work correctly in tests

app.get('/test-session-limit', sessionLimiter, (req, res) => {
  res.status(200).json({ message: 'Success' });
});

describe('Rate Limiter Middleware', () => {
  it('should allow requests under the limit', async () => {
    const response = await request(app).get('/test-session-limit');
    expect(response.status).toBe(200);
  });

  it('should block requests over the limit (30 requests)', async () => {
    // We already made 1 request in the previous test if run in same suite,
    // but Jest runs them fresh or we can just loop enough times.
    // sessionLimiter max is 30.

    // First 29 more requests (total 30) should pass
    for (let i = 0; i < 29; i++) {
      await request(app).get('/test-session-limit');
    }

    // 31st request should be blocked
    const response = await request(app).get('/test-session-limit');
    expect(response.status).toBe(429);
    expect(response.body.message).toBe('Too many requests, please try again later');
  });
});
