/**
 * Integration tests for auth + RBAC using an in-memory MongoDB instance
 * (no external DB required to run these tests).
 */
process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  app = require('../app');
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('Authentication', () => {
  const student = { email: 'student.test@example.com', password: 'StrongPass123', fullName: 'Test Student', studentId: 'STEST01' };

  test('health check works', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('student can self-register', async () => {
    const res = await request(app).post('/api/auth/register').send(student);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('STUDENT');
  });

  test('cannot register a duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(student);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('cannot self-register as FACULTY/ADMIN', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...student, email: 'sneaky@example.com', studentId: 'STEST02', role: 'ADMIN' });
    expect(res.status).toBe(403);
  });

  test('login fails with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: student.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  test('login fails for unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'whatever123' });
    expect(res.status).toBe(401);
  });

  test('login succeeds with correct credentials and returns a usable token', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: student.email, password: student.password });
    expect(res.status).toBe(200);
    const token = res.body.data.token;

    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(student.email);
  });

  test('no token -> 401 on a protected route', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
  });
});

describe('Role-based access control', () => {
  let studentToken;
  let studentId;

  beforeAll(async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'student.test@example.com', password: 'StrongPass123' });
    studentToken = loginRes.body.data.token;
    studentId = loginRes.body.data.profile._id;
  });

  test('student cannot access admin-only stats route (403)', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  test('student cannot list all students (faculty/admin only route, 403)', async () => {
    const res = await request(app).get('/api/students').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  test('student CAN view their own student record', async () => {
    const res = await request(app).get(`/api/students/${studentId}`).set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.student._id).toBe(studentId);
  });
});

describe('What-if simulator never touches the database', () => {
  let studentToken;

  beforeAll(async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'student.test@example.com', password: 'StrongPass123' });
    studentToken = loginRes.body.data.token;
  });

  test('simulator returns a computed result without requiring/mutating stored student data', async () => {
    const res = await request(app)
      .post('/api/simulator/risk')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ attendancePercentage: 75, academicAverage: 55, assignmentCompletionPercentage: 60, trendDelta: -10 });

    expect(res.status).toBe(200);
    expect(res.body.data.simulatedRiskScore).toBeDefined();
    expect(res.body.data.simulatedRiskLevel).toBeDefined();
    expect(res.body.data.disclaimer).toMatch(/hypothetical/i);
  });
});
