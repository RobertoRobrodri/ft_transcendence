 /**
 * More information about configuration can be found at 🔎:
 *
 * https://trufflesuite.com/docs/truffle/reference/configuration
 * 
 * --------------------------------------------------------------------------
 * 
 * Truffle Dashboard lets you review transactions in detail, and leverages
 * MetaMask for signing, so there's no need to copy-paste your mnemonic.
 * More details can be found at 🔎:
 *
 * https://trufflesuite.com/docs/truffle/getting-started/using-the-truffle-dashboard/
 */

module.exports = {
    networks: {
        development: {
            host: "ganache",
            port: 8545,
            // network_id: "*",
            network_id: "5777",
          },
    },
    compilers: {
        solc: {
            version: "0.8.17",
      },
    },
  };