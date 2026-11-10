import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import './setup.js';

describe('Security', () => {
  describe('HTTP headers (helmet)', () => {
    it('should set security headers and hide Express', async () => {
      const response = await request(createApp()).get('/health').expect(200);

      expect(response.headers).not.toHaveProperty('x-powered-by');
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
      expect(response.headers).toHaveProperty('content-security-policy');
    });
  });

  describe('Protected routes', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(createApp()).get('/api/ofs').expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });

  describe('Rate limiting (express-rate-limit)', () => {
    it('should expose rate limit headers on API routes', async () => {
      const response = await request(createApp()).get('/api/columns').expect(401);

      expect(response.headers).toHaveProperty('ratelimit-policy');
      expect(response.headers).toHaveProperty('ratelimit');
    });

    it('should return 429 after 10 failed login attempts', async () => {
      const app = createApp();
      const credentials = { email: 'attacker@example.com', password: 'wrong-password' };

      for (let attempt = 0; attempt < 10; attempt++) {
        await request(app).post('/api/auth/login').send(credentials).expect(401);
      }

      const response = await request(app).post('/api/auth/login').send(credentials).expect(429);

      expect(response.body).toHaveProperty('error', 'Too many login attempts, please try again later');
    });
  });
});
