const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './lib/main.js',
  output: {
    path: __dirname + '/lib',
    filename: 'index_bundle.js'
  },
  target: 'node',
//  node: {
//  fs: "empty"
//  },
  plugins: [
    new HtmlWebpackPlugin()
  ]
}
