const { merge } = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common');
 
module.exports = merge(common, {
  mode: 'development',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    watchFiles: ['index.html', 'FEBE/frontend/src/**/*'],
    open: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
});