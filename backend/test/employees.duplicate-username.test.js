const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { setupTestDb } = require('./helpers');

describe('Employee Manager duplicate username handling', () => {
  let employerToken;

  beforeEach(async () => {
    await setupTestDb();

    employerToken = jwt.sign(
      { userId: 1, role: 'employer' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  it('returns 409 when creating an employee with an existing username', async () => {
    const res = await request(app)
      .post('/employees/create')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({
        username: 'worker1',
        password: 'anotherpass123',
      });

    expect(res.status).to.equal(409);
    expect(res.body).to.have.property('error');
    expect(res.body.error).to.equal('Username already exists');
  });
});