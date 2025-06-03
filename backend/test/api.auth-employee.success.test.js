const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');
const { setupTestDb } = require('./helpers');

describe('Employee Manager API auth/employee success test', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  it('logs in as employer, creates an employee, and lists employees', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        username: 'boss',
        password: 'bosspass123',
      });

    expect(loginRes.status).to.equal(200);
    expect(loginRes.body).to.have.property('token');

    const token = loginRes.body.token;

    const createRes = await request(app)
      .post('/employees/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'worker2',
        password: 'workerpass123',
      });

    expect(createRes.status).to.equal(201);
    expect(createRes.body).to.deep.equal({
      message: 'Employee created successfully',
    });

    const listRes = await request(app)
      .get('/employees/list')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).to.equal(200);
    expect(listRes.body).to.have.property('employees');
    expect(listRes.body.employees).to.be.an('array');

    const usernames = listRes.body.employees.map((e) => e.username);
    expect(usernames).to.include('worker1');
    expect(usernames).to.include('worker2');
  });
});