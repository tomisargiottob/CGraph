module.exports = function availableCryptosCollection(db, logger) {
  const controllerLogger = logger.child({ module: 'availableCryptosController' });
  return {
    get: async function getAvailableCryptos(req, res) {
      const { where } = req.query;
      const log = controllerLogger.child({ function: 'getAvailableCryptos' });
      try {
        const market = await db.market.getLastMarket();
        log.info('Market fetched, sending crypto names');
        let availableCryptos = Object.keys(market.prices);
        if (where && where.asset) {
          availableCryptos = availableCryptos.filter((crypto) => crypto
            .toUpperCase()
            .includes(where.asset.toUpperCase()));
        }
        return res.status(200).json({ availableCryptos, count: availableCryptos.length });
      } catch (err) {
        log.error(err.message);
        return res.status(500).json({ message: 'Could not get user apiKeys' });
      }
    },
  };
};
