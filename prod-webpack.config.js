const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './lib/main_frame.js',
  output: {
    path: __dirname + '/lib',
    filename: 'index_bundle.js'
  },
  target: 'web',
  plugins: [
      new HtmlWebpackPlugin({
	  template: 'src/index_template.html'
      })
  ]
}
