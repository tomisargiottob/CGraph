module.exports = function staticCryptoController(logger, db, uuid) {
  return {
    post: async function addUserStaticCrypto(req, res) {
      const { id } = req.params;
      const log = logger.child({ module: 'staticCryptoController', method: 'addUserStaticCrypto', userId: id });
      const { asset, amount, averagePrice } = req.body;
      log.info('Add crypto to user request recieved');
      try {
        log.info('Searching for user information');
        const user = await db.user.getUserById(id);
        if (!user) {
          log.warn('User does not exist');
          return res.status(404).json({ message: 'User does not exist' });
        }
        const userStaticCryptos = await db.staticCrypto.findUserStaticCryptos(user.id);
        const oldStaticCrypto = userStaticCryptos.find((crypto) => crypto.asset === asset);
        let cryptoData;
        if (oldStaticCrypto) {
          const newAveragePrice = (
            oldStaticCrypto.averagePrice * oldStaticCrypto.amount
            + averagePrice * amount
          )
          / (oldStaticCrypto.amount + amount);
          const newAmount = oldStaticCrypto.amount + amount;
          log.info('Static Crypto found, updating amount and avarge price crypto');
          await oldStaticCrypto.update({ averagePrice: newAveragePrice, amount: newAmount });
        } else {
          cryptoData = {
            _id: uuid(),
            asset,
            amount,
            averagePrice,
            userId: id,
          };
          log.info('Adding static crypto');
          await db.staticCrypto.addStaticCrypto(cryptoData);
        }
        const staticCrypto = await db.staticCrypto.findStaticCryptoById(
          // eslint-disable-next-line no-underscore-dangle
          oldStaticCrypto?.id || cryptoData._id,
          user.id,
        );
        log.info('Static crypto succesfully added');
        return res.status(200).json(staticCrypto.toJson());
      } catch (err) {
        log.error(err.message);
        return res.status(500).json({ message: err.message });
      }
    },
    get: async function getUserStaticCryptos(req, res) {
      const { id } = req.params;
      const log = logger.child({ module: 'staticCryptoController', method: 'getUserStaticCryptos', userId: id });
      log.info('Get user crypto request recieved');
      try {
        log.info('Searching for user information');
        const user = await db.user.getUserById(id);
        if (!user) {
          log.warn('User does not exist');
          return res.status(404).json({ message: 'User does not exist' });
        }
        const staticCryptos = await db.staticCrypto.findUserStaticCryptos(id);
        const parsedStaticCryptos = staticCryptos.map((crypto) => crypto.toJson());
        log.info('Static cryptos succesfully retrived');
        return res.status(200).json({ staticCryptos: parsedStaticCryptos });
      } catch (err) {
        log.error(err.message);
        return res.status(500).json({ message: err.message });
      }
    },
  };
};
