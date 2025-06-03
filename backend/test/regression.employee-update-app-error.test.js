const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { setupTestDb, closeTestDb } = require('./helpers');

describe('Employee Manager regression test', () => {
  let employerToken;

  beforeEach(async () => {
    await setupTestDb();

    employerToken = jwt.sign(
      { userId: 1, role: 'employer' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  it('returns 400 instead of crashing when no employee updates are provided', async () => {
    const res = await request(app)
      .put('/employees/update')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({
        id: 2,
        username: 'worker1',
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
    expect(res.body.error).to.equal('No updates provided');
  });
});