/**
 * Created by j0sh on 7/19/16.
 */
var path = require('path');

module.exports = {
    entry: "./js/mandelbrot",
    output: {
        path: __dirname,
        filename: "build/bundle.js",
        sourceMapFilename: "sourcemap"
    },
    resolve: {
        // Allow to omit extensions when requiring these files
        extensions: ['', '.js'],
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
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel-loader"
            },
            {
                test: /\.glsl$/,
                exclude: /node_modules/,
                loader: "raw-loader"
            }
        ]
    },
    devtool: "#inline-source-map"
};