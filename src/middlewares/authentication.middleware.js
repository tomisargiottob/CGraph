const jwt = require('jsonwebtoken');
const logger = require('../components/logger/logger');

function verifySession(redis) {
  const log = logger.child({ module: 'sessionMiddleware' });
  return async (req, res, next) => {
    const publicAccess = req.url === '/api/v1/login' || (req.url === '/api/v1/users' && req.method === 'POST') || req.url.includes('/api-doc/');
    if (!publicAccess) {
      const token = req.body.token || req.query.token || req.headers['x-access-token'];
      if (!token) {
        log.info('Unauthorized request, missing token');
        return res.status(401).json({ message: 'Unauthorized' });
      }
      try {
        const user = await redis.getUser(token);
        if (!user) {
          log.info('Unauthorized request, token has expired or not valid');
          return res.status(401).json({ message: 'User session expired' });
        }
        const tokenInfo = jwt.decode(token);
        if (!req.url.includes(tokenInfo.user_id) && !req.url.includes('/api/v1/availableCryptos')) {
          log.info('Unauthorized request, token has no authorization for this action');
          return res.status(401).json({ message: 'Permission denied' });
        }
        req.user = JSON.parse(user);
      } catch (err) {
        log.info({ reason: err.message }, 'Could not process request session');
        return res.status(500).json({ message: 'Could not process request session' });
      }
      return next();
    }

    return next();
  };
}
module.exports = { verifySession };
