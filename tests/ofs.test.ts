import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { OF } from '../src/models/OF.js';
import {
  createTestUser,
  getAuthToken,
  createTestColumn,
  createTestOF,
} from './helpers.js';
import './setup.js';
import { Types } from 'mongoose';

const app = createApp();

describe('OFs Routes', () => {
  let authToken: string;
  let userId: string;
  let columnId: string;

  beforeEach(async () => {
    const user = await createTestUser(`test-${Date.now()}@example.com`);
    userId = user._id.toString();
    authToken = getAuthToken(user);

    const column = await createTestColumn(`Test Column ${Date.now()}`, 0);
    columnId = (column._id as Types.ObjectId).toString();
  });

  describe('GET /api/ofs', () => {
    it('should return empty array when no OFs exist', async () => {
      const response = await request(app)
        .get('/api/ofs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'OFs retrieved successfully');
      expect(response.body.data).toEqual([]);
    });

    it('should return all OFs', async () => {
      const of1 = await createTestOF(columnId, 'OF 1', 'Description 1', 0);
      const of2 = await createTestOF(columnId, 'OF 2', 'Description 2', 1);

      const response = await request(app)
        .get('/api/ofs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('title', 'OF 1');
      expect(response.body.data[1]).toHaveProperty('title', 'OF 2');
    });

    it('should filter OFs by columnId', async () => {
      const column2 = await createTestColumn('Column 2', 1);
      const of1 = await createTestOF(columnId, 'OF in Column 1', undefined, 0);
      const of2 = await createTestOF(
        (column2._id as Types.ObjectId).toString(),
        'OF in Column 2',
        undefined,
        0
      );

      const response = await request(app)
        .get(`/api/ofs?columnId=${columnId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('title', 'OF in Column 1');
    });

    it('should return 401 without authentication token', async () => {
      await request(app).get('/api/ofs').expect(401);
    });
  });

  describe('GET /api/ofs/:id', () => {
    it('should return a single OF by id', async () => {
      const of = await createTestOF(columnId, 'My OF', 'My description', 0);

      const response = await request(app)
        .get(`/api/ofs/${of._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('title', 'My OF');
      expect(response.body.data).toHaveProperty('description', 'My description');
      expect(response.body.data._id).toBe((of._id as Types.ObjectId).toString());
    });

    it('should return 404 if OF does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/ofs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'OF not found');
    });

    it('should return 401 without authentication token', async () => {
      await request(app)
        .get('/api/ofs/507f1f77bcf86cd799439011')
        .expect(401);
    });
  });

  describe('POST /api/ofs', () => {
    it('should create a new OF', async () => {
      const response = await request(app)
        .post('/api/ofs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New OF',
          description: 'New description',
          columnId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'OF created successfully');
      expect(response.body.data).toHaveProperty('title', 'New OF');
      expect(response.body.data).toHaveProperty('description', 'New description');
      expect(response.body.data).toHaveProperty('columnId', (columnId as unknown as Types.ObjectId).toString());
      expect(response.body.data).toHaveProperty('position', 0);
    });

    it('should create OF without description', async () => {
      const response = await request(app)
        .post('/api/ofs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'OF without description',
          columnId,
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('title', 'OF without description');
    });

    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/ofs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          columnId,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if columnId is missing', async () => {
      const response = await request(app)
        .post('/api/ofs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'OF Title',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 without authentication token', async () => {
      await request(app)
        .post('/api/ofs')
        .send({
          title: 'New OF',
          columnId,
        })
        .expect(401);
    });
  });

  describe('PUT /api/ofs/:id', () => {
    it('should update an OF', async () => {
      const of = await createTestOF(columnId, 'Old Title', 'Old description', 0);

      const response = await request(app)
        .put(`/api/ofs/${of._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'OF updated successfully');
      expect(response.body.data).toHaveProperty('title', 'Updated Title');
      expect(response.body.data).toHaveProperty('description', 'Updated description');
    });

    it('should return 404 if OF does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/ofs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'OF not found');
    });

    it('should return 401 without authentication token', async () => {
      await request(app)
        .put('/api/ofs/507f1f77bcf86cd799439011')
        .send({
          title: 'Updated Title',
        })
        .expect(401);
    });
  });

  describe('PATCH /api/ofs/:id/move', () => {
    it('should move OF to a different column', async () => {
      const column2 = await createTestColumn('Target Column', 1);
      const of = await createTestOF(columnId, 'OF to move', undefined, 0);

      const response = await request(app)
        .patch(`/api/ofs/${of._id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          columnId: (column2._id as Types.ObjectId).toString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'OF moved successfully');
      expect(response.body.data.columnId).toBe((column2._id as Types.ObjectId).toString());
    });

    it('should move OF to a different position', async () => {
      const of = await createTestOF(columnId, 'OF to move', undefined, 0);
      await createTestOF(columnId, 'Other OF', undefined, 1);

      const response = await request(app)
        .patch(`/api/ofs/${of._id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          position: 2,
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('position', 2);
    });

    it('should move OF to different column and position', async () => {
      const column2 = await createTestColumn('Target Column', 1);
      const of = await createTestOF(columnId, 'OF to move', undefined, 0);

      const response = await request(app)
        .patch(`/api/ofs/${of._id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          columnId: (column2._id as Types.ObjectId).toString(),
          position: 5,
        })
        .expect(200);

      expect(response.body.data.columnId).toBe((column2._id as Types.ObjectId).toString());
      expect(response.body.data).toHaveProperty('position', 5);
    });

    it('should return 404 if OF does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .patch(`/api/ofs/${fakeId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          position: 2,
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'OF not found');
    });

    it('should return 401 without authentication token', async () => {
      await request(app)
        .patch('/api/ofs/507f1f77bcf86cd799439011/move')
        .send({
          position: 2,
        })
        .expect(401);
    });
  });

  describe('DELETE /api/ofs/:id', () => {
    it('should delete an OF', async () => {
      const of = await createTestOF(columnId, 'OF to delete', undefined, 0);

      const response = await request(app)
        .delete(`/api/ofs/${of._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'OF deleted successfully');

      // Verify OF is deleted
      const deletedOF = await OF.findById(of._id);
      expect(deletedOF).toBeNull();
    });

    it('should return 404 if OF does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/ofs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'OF not found');
    });

    it('should return 401 without authentication token', async () => {
      await request(app)
        .delete('/api/ofs/507f1f77bcf86cd799439011')
        .expect(401);
    });
  });
});

