const path = require('path');

module.exports = {
  devServer: {
    historyApiFallback: {
      disableDotRule: true,
      rewrites: [
        { from: /^\/.*$/, to: '/index.html' }
      ]
    },
    static: {
      directory: path.join(__dirname, 'dist/browser')
    },
    compress: true,
    port: 4200,
    host: '0.0.0.0',
    hot: true,
    open: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  }
};
