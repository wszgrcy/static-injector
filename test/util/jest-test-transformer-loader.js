require('ts-node').register({
  require: ['tsconfig-paths/register'],
  project: './tsconfig.transform.json',
});
module.exports = require('./jest-test-transformer');
