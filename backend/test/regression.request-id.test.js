const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');

describe('Employee Manager regression test', () => {
  it('reuses client-provided X-Request-Id instead of generating a new one', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('X-Request-Id', 'qa-regression-123')
      .send({
        username: '',
        password: '',
      });

    expect(res.headers).to.have.property('x-request-id');
    expect(res.headers['x-request-id']).to.equal('qa-regression-123');
  });
});