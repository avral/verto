let Eos = require('eosjs')
import store from '@/store'

// const floatRegex = /[^\d.-]/g
const { ecc } = Eos.modules

class EosWrapper {
  constructor (config) {
    this.eos = Eos(
      Object.assign({}, config, {
        chainId: process.env[store.state.settings.network].CHAIN_ID,
        httpEndpoint: process.env[store.state.settings.network].EOS_HISTORYAPI,
        expireInSeconds: 60,
        verbose: true,
        debug: false,
        sign: true
      })
    )
  }

  isPrivKeyValid (privKey) {
    const bool = ecc.isValidPrivate(privKey) === true
    return bool
  }

  fromPrivToPub (wif) {
    const pubKey = ecc.privateToPublic(wif)
    return pubKey
  }

  //  ---- ACCOUNTS ----
  getAccountNamesFromPubKeyP (pubKey) {
    /* eslint-disable no-new */
    return new Promise((resolve, reject) => {
      this.eos.getKeyAccounts(pubKey, (error, result) => {
        if (error) reject(error)
        resolve(result)
      // array of account names, can be multiples
      // output example: { account_names: [ 'itamnetwork1', ... ] }
      })
    })
  }

  async getActions (accountName) {
    const actions = (await this.eos.getActions(accountName)).actions
    return actions
  }

  async getAccount (accountName) {
    let account = (await this.eos.getAccount(accountName))
    return account
  }

  // If you look at the result value, you can see an array in the form of a string.
  // This is because there could be tokens with many different symbols in the account
  getCurrencyBalanceP (accountName, contractName = 'eosio.token') {
    return new Promise((resolve, reject) => {
      this.eos.getCurrencyBalance(contractName, accountName, (error, result) => {
        if (error) reject(error)
        resolve(result)
      })
    })
  }

  //  ---- TRANSACTIONS ----
  // https://eosio.stackexchange.com/questions/3587/how-to-transfer-eos-token-using-scatter-js-or-eos-js
  async transferToken (contractName = 'eosio.token', from, to, quantity, memo = '', keyProvider) {
    const tr = await this.eos.transaction({
      actions: [
        {
          account: contractName,
          name: 'transfer',
          authorization: [{
            actor: from,
            permission: 'active'
          }
          ],
          data: {
            from,
            to,
            quantity,
            memo
          }
        }]
    }, { keyProvider })
    return tr
  }

  async transact (actions, keyProvider) {
    const result = await this.eos.transaction(
      actions,
      keyProvider
    )
    return result
  }

  async isAccount (account) {
    const result = await this.eos.is_account(
      account
    )
    return result
  }

  async getTable (code, scope, table, lowerBound,
    limit) {
    const result = await this.eos.getTableRows({
      code,
      scope,
      table,
      lower_bound: lowerBound,
      limit,
      json: true
    })
    return result.rows
  }
}

// Import style
export default EosWrapper
