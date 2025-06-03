const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');
const { setupTestDb } = require('./helpers');

describe('Employee Manager unauthorized API test', () => {
  before(async () => {
    await setupTestDb();
  });

  it('rejects employee list access without token', async () => {
    const res = await request(app).get('/employees/list');

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error');
    expect(res.body.error).to.equal('Not authorized');
  });

  it('rejects employee create access with employee token', async () => {
    const employeeToken = require('jsonwebtoken').sign(
      { userId: 2, role: 'employee' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .post('/employees/create')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        username: 'blockeduser',
        password: 'blockedpass123',
      });

    expect(res.status).to.equal(403);
    expect(res.body).to.have.property('error');
  });
});