import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Column } from '../src/models/Column.js';
import { createTestUser, getAuthToken, createTestColumn } from './helpers.js';
import './setup.js';

const app = createApp();

describe('Columns Routes', () => {
  let authToken: string;

  beforeEach(async () => {
    const user = await createTestUser(`test-${Date.now()}@example.com`);
    authToken = getAuthToken(user);
  });

  describe('GET /api/columns', () => {
    it('should return empty array when no columns exist', async () => {
      const response = await request(app)
        .get('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Columns retrieved successfully');
      expect(response.body.data).toEqual([]);
    });

    it('should return all columns sorted by position', async () => {
      await createTestColumn('Done', 1);
      await createTestColumn('To Do', 0);

      const response = await request(app)
        .get('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('name', 'To Do');
      expect(response.body.data[1]).toHaveProperty('name', 'Done');
      expect(response.body.data[0]).toHaveProperty('_id');
      expect(response.body.data[0]).toHaveProperty('position', 0);
      expect(response.body.data[0]).toHaveProperty('createdAt');
      expect(response.body.data[0]).toHaveProperty('updatedAt');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app).get('/api/columns').expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should return 401 with an invalid token', async () => {
      const response = await request(app)
        .get('/api/columns')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });

  describe('POST /api/columns', () => {
    it('should create a new column and insert it in database', async () => {
      const response = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'In Progress' })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Column created successfully');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('name', 'In Progress');
      expect(response.body.data).toHaveProperty('position', 0);

      const column = await Column.findById(response.body.data._id);
      expect(column).not.toBeNull();
      expect(column?.name).toBe('In Progress');
      expect(await Column.countDocuments()).toBe(1);
    });

    it('should place the new column after the last one', async () => {
      await createTestColumn('To Do', 0);

      const response = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'In Progress' })
        .expect(201);

      expect(response.body.data).toHaveProperty('position', 1);
      expect(await Column.countDocuments()).toBe(2);
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body.details[0]).toHaveProperty('path', 'name');
      expect(await Column.countDocuments()).toBe(0);
    });

    it('should return 401 without authentication token', async () => {
      await request(app)
        .post('/api/columns')
        .send({ name: 'In Progress' })
        .expect(401);

      expect(await Column.countDocuments()).toBe(0);
    });
  });
});
