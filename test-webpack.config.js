const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin')

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
  plugins: [
      new HtmlWebpackPlugin({
	  template: 'src/index_template.html'
      })
  ]
}
