const path = require('path');
const isProd = 'PRODUCTION' in process.env;
module.exports = {
  mode: isProd ? 'production' : 'development',
  entry: path.resolve(__dirname, '../lib/index.js'),
  devtool: isProd ? false : 'sourcemap',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: `jinge-worker-utility.${isProd ? 'min.' : ''}js`,
    chunkFilename: `[hash].${isProd ? 'min.' : ''}js`,
    library: 'JingeWorkerUtility',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  resolve: {
    alias: {
      'jinge-bson': path.resolve(__dirname, '../deps/jinge-bson'),
      'jinge-wasm-utility': path.resolve(__dirname, '../deps/jinge-wasm-utility')
    }
  },
  module: {
    rules: [{
      test: /\.wasm$/,
      type: 'javascript/auto', /** this disabled webpacks default handling of wasm */
      use: [{
        loader: 'file-loader',
        options: {
          name: '[hash].[ext]'
        }
      }]
    }]
  },
  devServer: {
    publicPath: '/.tmp',
    contentBase: path.resolve(__dirname, '../')
  }
};
