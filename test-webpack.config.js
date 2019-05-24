const path = require('path');


module.exports = {
  entry: './lib/tests.js',
  output: {
    path: __dirname + '/lib',
    filename: 'test_bundle.js'
  },
  node: {
  fs: 'empty'
  },
  target: 'web',
}
