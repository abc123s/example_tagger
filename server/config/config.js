// Hierarchical node.js configuration with command-line arguments, environment
// variables, and files.
const nconf = require('nconf');
const path = require('path');

nconf
  // 1. Command-line arguments
  .argv()
  // 2. Environment variables
  .env({
    whitelist: ['DEBUG'],
    parseValues: true,
  })
  // 3. Config file
  .file({ file: path.join(__dirname, 'config.json') })
  // 4. Defaults
  .defaults({
    DEBUG: false,
    STAGING: false,
  });

module.exports = nconf;
