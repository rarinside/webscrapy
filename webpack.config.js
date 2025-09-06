const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.ts',
    output: {
      filename: isProduction ? 'web-data-extractor.min.js' : 'web-data-extractor.js',
      path: path.resolve(__dirname, 'dist'),
      library: 'WebDataExtractor',
      libraryTarget: 'umd',
      globalObject: 'this',
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@classes': path.resolve(__dirname, 'src/classes'),
        '@utilities': path.resolve(__dirname, 'src/utilities'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@assets': path.resolve(__dirname, 'src/assets')
      }
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'web-data-extractor.min.css'
        })
      ] : [])
    ],
    optimization: {
      minimize: isProduction
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    target: 'web'
  };
};