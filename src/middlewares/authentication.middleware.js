const jwt = require('jsonwebtoken');

const config = require('config');

function verifyToken(req, res, next) {
  if (req.url !== '/login' && (req.url !== '/user' && req.method !== 'POST') && req.url !== '/api-doc/') {
    const token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (!token) {
      return res.status(401).send('Unauthorized');
    }
    try {
      const decoded = jwt.verify(token, config.auth.secret);
      req.user = decoded;
    } catch (err) {
      return res.status(401).send('Unauthorized');
    }
    return next();
  }
  return next();
}
module.exports = { verifyToken };
