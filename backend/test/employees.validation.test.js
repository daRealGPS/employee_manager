const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { setupTestDb } = require('./helpers');

describe('Employee Manager employee form validation', () => {
  let employerToken;

  before(async () => {
    await setupTestDb();

    employerToken = jwt.sign(
      { userId: 1, role: 'employer' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  it('rejects create employee when username is empty', async () => {
    const res = await request(app)
      .post('/employees/create')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({
        username: '',
        password: 'abcdef',
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('rejects create employee when password is too short', async () => {
    const res = await request(app)
      .post('/employees/create')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({
        username: 'newemployee',
        password: '123',
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });
});