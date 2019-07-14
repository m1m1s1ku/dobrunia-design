'use strict';

const { resolve, join } = require('path');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CreateFilePlugin = require('create-file-webpack')

const {exec} = require('child_process');
const {writeFileSync, readFileSync} = require('fs');

exec("git rev-parse --short HEAD", (_err, stdout) => {
  writeFileSync('src/config.json', JSON.stringify({
    name: 'Dobrunia',
    revision: 'dobrunia-' + stdout.replace('\n', '')
  }, null, 2))
});

const ENV = process.argv.find(arg => arg.includes('production'))
  ? 'production'
  : 'development';
const OUTPUT_PATH = ENV === 'production' ? resolve('dist') : resolve('src');
const INDEX_TEMPLATE = resolve('./src/index.ejs');

const webcomponentsjs = './node_modules/@webcomponents/webcomponentsjs';
const webanimationsjs = './node_modules/web-animations-js';

const assets = [
  {
    from: resolve('./src/assets'),
    to: resolve('dist/assets/')
  }
];

const polyfills = [
  {
    from: resolve(`${webcomponentsjs}/webcomponents-*.js`),
    to: join(OUTPUT_PATH, 'vendor'),
    flatten: true
  },
  {
    from: resolve(`${webcomponentsjs}/bundles/*.js`),
    to: join(OUTPUT_PATH, 'vendor', 'bundles'),
    flatten: true
  },
  {
    from: resolve(`${webcomponentsjs}/custom-elements-es5-adapter.js`),
    to: join(OUTPUT_PATH, 'vendor'),
    flatten: true
  },
  {
    from: resolve(`${webanimationsjs}/web-animations-next-lite.min.js`),
    to: join(OUTPUT_PATH, 'vendor'),
    flatten: true
  },
  {
    from: resolve(`./src/config.json`),
    to: OUTPUT_PATH,
    flatten: true
  },
  {
    from: resolve(`./src/robots.txt`),
    to: OUTPUT_PATH,
    flatten: true
  },
  {
    from: resolve(`./src/favicon.ico`),
    to: OUTPUT_PATH,
    flatten: true
  },
  {
    from: resolve(`./src/boot.js`),
    to: OUTPUT_PATH,
    flatten: true
  },
  {
    from: resolve(`./src/service-worker.js`),
    to: OUTPUT_PATH,
    flatten: true
  }
];

const subDirectory = ENV === 'production' ? '' : '';

const commonConfig = merge([
  {
    entry: './src/elara-app.ts',
    output: {
      path: OUTPUT_PATH,
      filename: '[name].[chunkhash:8].js',
      publicPath: ENV === 'production' ? '/' : '/'
    },
    resolve: {
      extensions: [ '.ts', '.js', '.css' ]
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['css-loader'],
        },
        {
          enforce: 'pre',
          test: /\.tsx?$/,
          loader: 'eslint-loader',
          exclude: /node_modules/,
          options: {
            emitWarning: ENV === 'development',
            failOnWarning: ENV === 'development',
            failOnError: false
          }
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.ejs/,
          loader: 'ejs-loader',
          exclude: /node_modules/
        }
      ]
    }
  }
]);

const developmentConfig = merge([
  {
    devtool: 'cheap-module-source-map',
    plugins: [
      new CopyWebpackPlugin(polyfills),
      new HtmlWebpackPlugin({
        template: INDEX_TEMPLATE
      }),
      new CreateFilePlugin({
        path: './dist',
        fileName: 'config.json',
        content: readFileSync('./src/config.json')
      })
    ],

    devServer: {
      contentBase: OUTPUT_PATH,
      compress: true,
      overlay: true,
      port: 3000,
      historyApiFallback: true,
      host: 'localhost'
    }
  }
]);

const productionConfig = merge([
  {
    devtool: 'nosources-source-map',
    plugins: [
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin([...polyfills, ...assets]),
      new HtmlWebpackPlugin({
        pathname: `${subDirectory ? '/'+subDirectory : ''}`,
        template: INDEX_TEMPLATE,
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true
        }
      }),
      new CreateFilePlugin({
        path: './dist',
        fileName: 'config.json',
        content: readFileSync('./src/config.json')
      })
    ]
  }
]);

module.exports = mode => {
  if (mode === 'production') {
    return merge(commonConfig, productionConfig, { mode });
  }

  return merge(commonConfig, developmentConfig, { mode });
};


