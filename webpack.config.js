/**
 * Created by j0sh on 7/19/16.
 */
var path = require('path');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');


module.exports = {
    entry: "./js/mandelbrot",
    output: {
        path: __dirname,
        filename: "build/bundle.js"
    },
    resolve: {
        // Allow to omit extensions when requiring these files
        // extensions: ['', '.js'],
        alias: {
            // assets:     path.resolve(__dirname, 'assets'),
            javascript: path.resolve(__dirname, 'js'),
            shaders:    path.resolve(__dirname, 'shaders'),
            utility:    path.resolve(__dirname, 'utility')
        }
    },
    module: {
        loaders: [
            {
                test: /\.glsl$/,
                exclude: /node_modules/,
                loader: "raw-loader"
            }
        ]
    },
    plugins: [
      new UglifyJSPlugin()
    ]
};
