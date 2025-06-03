const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('Employee Manager login failure', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('throws Invalid credentials when user is not found', async () => {
    const queryStub = sinon.stub().resolves({ rows: [] });
    const auditLogStub = sinon.stub();

    const { login } = proxyquire('../controllers/authController', {
      '../db': { query: queryStub },
      bcrypt: { compare: sinon.stub() },
      jsonwebtoken: { sign: sinon.stub() },
      '../utils/audit': { auditLog: auditLogStub },
    });

    const req = {
      body: { username: 'ghost', password: 'whatever' },
    };

    const res = {
      json: sinon.stub(),
    };

    try {
      await login(req, res);
      throw new Error('Expected login to throw');
    } catch (err) {
      // AppError extends Error and has a statusCode property
      expect(err.message).to.equal('Invalid credentials');
      expect(err.statusCode).to.equal(401);
      expect(auditLogStub.calledOnce).to.equal(true);
    }
  });

  it('throws Invalid credentials when password is wrong', async () => {
    const queryStub = sinon.stub().resolves({
      rows: [
        {
          id: 2,
          username: 'boss',
          password: 'hashed-password',
          role: 'employer',
        },
      ],
    });

    const compareStub = sinon.stub().resolves(false);
    const auditLogStub = sinon.stub();

    const { login } = proxyquire('../controllers/authController', {
      '../db': { query: queryStub },
      bcrypt: { compare: compareStub },
      jsonwebtoken: { sign: sinon.stub() },
      '../utils/audit': { auditLog: auditLogStub },
    });

    const req = {
      body: { username: 'boss', password: 'wrong-password' },
    };

    const res = {
      json: sinon.stub(),
    };

    try {
      await login(req, res);
      throw new Error('Expected login to throw');
    } catch (err) {
      expect(err.message).to.equal('Invalid credentials');
      expect(err.statusCode).to.equal(401);
      expect(auditLogStub.calledOnce).to.equal(true);
    }
  });
});