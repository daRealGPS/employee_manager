const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('Employee Manager login success', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns a JWT token for valid employer credentials', async () => {
    const queryStub = sinon.stub().resolves({
      rows: [
        {
          id: 1,
          username: 'boss',
          password: 'hashed-password',
          role: 'employer',
        },
      ],
    });

    const compareStub = sinon.stub().resolves(true);
    const signStub = sinon.stub().returns('fake-jwt-token');
    const auditLogStub = sinon.stub();

    const { login } = proxyquire('../controllers/authController', {
      '../db': { query: queryStub },
      bcrypt: { compare: compareStub },
      jsonwebtoken: { sign: signStub },
      '../utils/audit': { auditLog: auditLogStub },
    });

    const req = {
      body: {
        username: 'boss',
        password: 'correct-password',
      },
    };

    const res = {
      json: sinon.stub(),
    };

    await login(req, res);

    expect(queryStub.calledOnce).to.equal(true);
    expect(compareStub.calledOnceWithExactly('correct-password', 'hashed-password')).to.equal(true);
    expect(signStub.calledOnce).to.equal(true);
    expect(signStub.firstCall.args[0]).to.deep.equal({
      userId: 1,
      role: 'employer',
    });
    expect(res.json.calledOnceWithExactly({ token: 'fake-jwt-token' })).to.equal(true);
    expect(auditLogStub.calledOnce).to.equal(true);
  });
});