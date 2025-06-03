const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { verifyToken, isEmployer } = require('../middleware/auth');

describe('Employee Manager protected route', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('allows access with a valid token', () => {
    const token = jwt.sign(
      { userId: 1, role: 'employer' },
      process.env.JWT_SECRET
    );

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const res = {};
    const next = sinon.stub();

    verifyToken(req, res, next);

    expect(req.user.userId).to.equal(1);
    expect(req.user.role).to.equal('employer');
    expect(next.calledOnce).to.equal(true);
  });

  it('throws 401 when token is missing', () => {
    const req = { headers: {} };
    const res = {};
    const next = sinon.stub();

    expect(() => verifyToken(req, res, next)).to.throw('Not authorized');
  });

  it('returns 403 for non-employer users on employer-only route', () => {
    const req = {
      user: {
        userId: 2,
        role: 'employee',
      },
    };

    const json = sinon.stub();
    const status = sinon.stub().returns({ json });

    const res = { status };
    const next = sinon.stub();

    isEmployer(req, res, next);

    expect(status.calledOnceWithExactly(403)).to.equal(true);
    expect(json.calledOnce).to.equal(true);
    expect(next.called).to.equal(false);
  });
});