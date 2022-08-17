/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
module.exports = {
  async up(db) {
    const wallets = await db.collection('wallet').find({}).toArray();
    for (const account of wallets) {
      const apiKey = await db.collection('apiKeys').findOne({ userId: account.userId });
      const newFormatWallet = { ...account };
      const binanceAccount = account.wallet;
      binanceAccount.account = 'binance';
      binanceAccount.apiKeyId = apiKey._id;
      newFormatWallet.totalValue = binanceAccount.value;
      newFormatWallet.accounts = [binanceAccount];
      delete newFormatWallet.wallet;
      await db.collection('wallet').updateOne({ _id: account._id }, { $set: newFormatWallet, $unset: { wallet: '' } });
    }
  },

  async down(db) {
    const wallets = await db.collection('wallet').find({}).toArray();
    for (const account of wallets) {
      const oldFormatWallet = { ...account };
      delete oldFormatWallet.totalValue;
      const oldWallet = account.accounts[0];
      delete oldWallet.account;
      delete oldWallet.apiKeyId;
      oldFormatWallet.wallet = oldWallet;
      delete oldFormatWallet.accounts;
      await db.collection('wallet').updateOne({ _id: account._id }, { $set: oldFormatWallet, $unset: { accounts: '', totalValue: '' } });
    }
  },
};
