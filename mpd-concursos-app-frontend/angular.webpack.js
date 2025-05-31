/**
 * Custom webpack configuration for Angular
 */

module.exports = {
  // Configuración personalizada para webpack
  resolve: {
    fallback: {
      fs: false,
      path: false,
      crypto: false
    }
  },
  // Configuración para el servidor de desarrollo
  devServer: {
    historyApiFallback: true,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  }
};
