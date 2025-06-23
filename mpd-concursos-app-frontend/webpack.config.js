const path = require('path');

module.exports = {
  devServer: {
    historyApiFallback: {
      index: '/index.html',
      disableDotRule: true,
      verbose: true,
      rewrites: [
        // Rutas específicas de la aplicación
        { from: /^\/dashboard\/.*$/, to: '/index.html' },
        { from: /^\/login$/, to: '/index.html' },
        { from: /^\/register$/, to: '/index.html' },
        { from: /^\/admin\/.*$/, to: '/index.html' },
        // Fallback para cualquier otra ruta
        { from: /^\/.*$/, to: '/index.html' }
      ]
    },
    static: {
      directory: path.join(__dirname, 'dist/browser'),
      publicPath: '/',
      serveIndex: false
    },
    compress: true,
    port: 4200,
    host: '0.0.0.0',
    hot: true,
    open: false,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    client: {
      overlay: {
        errors: true,
        warnings: false
      }
    }
  }
};
