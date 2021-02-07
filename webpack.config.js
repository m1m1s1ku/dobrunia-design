/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const { resolve, join } = require('path');

const ENV = process.argv.find((arg) => arg.includes('production'))
  ? 'production'
  : 'development';
const OUTPUT_PATH = ENV === 'production' ? resolve('dist') : resolve('src');
const INDEX_TEMPLATE = resolve('./src/index.ejs');

const nodeModules = './node_modules/';

const webcomponentsjs = join(nodeModules, '@webcomponents/webcomponentsjs');

const assets = [
  {
    from: resolve('./src/assets'),
    to: resolve('dist/assets/'),
  },
];

const polyfills = [
  {
    from: resolve(`${webcomponentsjs}/webcomponents-*.js`),
    to: join(OUTPUT_PATH, 'vendor', '[name].[ext]'),
  },
  {
    from: resolve(`${webcomponentsjs}/bundles/*.js`),
    to: join(OUTPUT_PATH, 'vendor', 'bundles', '[name].[ext]'),
  },
  {
    from: resolve(`${webcomponentsjs}/custom-elements-es5-adapter.js`),
    to: join(OUTPUT_PATH, 'vendor', '[name].[ext]'),
  },
  {
    from: resolve('./src/favicon.ico'),
    to: OUTPUT_PATH,
  },
  {
    from: resolve('./src/boot.js'),
    to: OUTPUT_PATH,
  },
  {
    from: resolve('./src/robots.txt'),
    to: OUTPUT_PATH,
  },
];

const subDirectory = ENV === 'production' ? '' : '';

const commonConfig = merge([
  {
    entry: './src/elara-app.ts',
    output: {
      path: OUTPUT_PATH,
      filename: '[name].[chunkhash:8].js',
      publicPath: ENV === 'production' ? '/' : '/',
    },
    resolve: {
      extensions: ['.ts', '.js', '.css'],
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['css-loader'],
          exclude: /node_modules/,
        },
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          use: ['url-loader?limit=10000', 'img-loader'],
        },
        {
          test: /\.svg$/,
          loader: 'svg-inline-loader',
        },
        {
          enforce: 'pre',
          test: /\.tsx?$/,
          loader: 'eslint-loader',
          exclude: /node_modules/,
          options: {
            fix: true,
            emitWarning: ENV === 'development',
            failOnWarning: ENV === 'development',
            failOnError: false,
          },
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.ejs/,
          loader: 'ejs-loader',
          exclude: /node_modules/,
          options: {
            esModule: false,
          },
        },
        {
          test: /\.(graphql)$/,
          exclude: /node_modules/,
          loader: 'raw-loader',
        },
        { 
          test: /\.scss?$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
          exclude: /node_modules/,
        },
      ],
    },
  },
]);

const developmentConfig = merge([
  {
    devtool: 'cheap-module-source-map',
    plugins: [
      new CopyWebpackPlugin({ patterns: polyfills }),
      new HtmlWebpackPlugin({
        template: INDEX_TEMPLATE,
      }),
    ],

    devServer: {
      contentBase: OUTPUT_PATH,
      compress: true,
      overlay: true,
      port: 3000,
      historyApiFallback: true,
      host: '0.0.0.0',
      disableHostCheck: true,
    },
  },
]);

const productionConfig = merge([
  {
    devtool: 'eval',
    plugins: [
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin({ patterns: [...polyfills, ...assets] }),
      new HtmlWebpackPlugin({
        pathname: `${subDirectory ? '/' + subDirectory : ''}`,
        template: INDEX_TEMPLATE,
        minify: {
          collapseWhitespace: true,
          removeComments: false,
          minifyCSS: true,
          minifyJS: true,
        },
      }),
    ],
  },
]);

module.exports = (mode) => {
  if (mode.production) {
    return merge(commonConfig, productionConfig, { mode });
  }

  return merge(commonConfig, developmentConfig, { mode });
};
