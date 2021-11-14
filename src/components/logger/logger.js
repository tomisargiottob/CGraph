const config = require('config');

const formatters = {
  bindings() {
    return {};
  },
  level(label) {
    return { level: label };
  },
};

const logger = require('pino')({
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  formatters,
  level: config.logger.level,
});

module.exports = logger;
