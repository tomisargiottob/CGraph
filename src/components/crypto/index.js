const crypto = require('crypto');
const config = require('config');

const iv = crypto.randomBytes(16);

class Encrypter {
  constructor(logger) {
    this.logger = logger.child({ module: 'Encrypter' });
    this.secretKey = crypto.createHash('sha256').update(String(config.crypto.secretKey)).digest('base64').substr(0, 32);
  }

  encrypt(text) {
    const logger = this.logger.child({ function: 'encrypt' });
    if (!text) return text;
    if (text.startsWith('{"iv":')) return text;
    const cipher = crypto.createCipheriv('aes-256-ctr', this.secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    logger.info('Text succesfully encrypted');
    return JSON.stringify({
      iv: iv.toString('hex'),
      content: encrypted.toString('hex'),
    });
  }

  decrypt(hash) {
    const logger = this.logger.child({ function: 'decrypt' });
    return new Promise((resolve, reject) => {
      try {
        if (!hash) return hash;
        if (!hash.startsWith('{"iv":')) return resolve(hash);
        const parsedhash = JSON.parse(hash);
        const decipher = crypto.createDecipheriv('aes-256-ctr', this.secretKey, Buffer.from(parsedhash.iv, 'hex'));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(parsedhash.content, 'hex')), decipher.final()]);
        return resolve(decrypted.toString());
      } catch (err) {
        logger.error('could not decrypt hash');
        return reject(err);
      }
    });
  }
}

module.exports = Encrypter;
