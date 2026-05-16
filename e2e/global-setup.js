const { seedEmulator } = require("./support/actions");

module.exports = async function globalSetup() {
  seedEmulator();
};
