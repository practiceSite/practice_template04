const webpack = require("webpack");
const path = require('path');

module.exports = {
	entry: ['./dev/src/assets/js/main.js'],
	output: {
		filename: "js/bundle.js",
		path: path.resolve(__dirname, 'public')
	},
	devServer: {
		contentBase: path.resolve(__dirname, 'public')
	},
	module: {
		rules: [{
				test: /\.js$/,
				use: [{
					loader: 'babel-loader',
					options: {
						presets: [
							['env', {
								'modules': false
							}]
						]
					}
				}],
				exclude: /node_modules/,
			},
			{
				test: /\.(css|sass|scss)$/,
				use: [
					'style-loader',
					'css-loader',
					{
						loader: "sass-loader",
						options: {
							data: "@import 'common.scss';",
							includePaths: [path.resolve(__dirname, 'dev/src/assets/styles')]
						},
					},
					{
						loader: 'postcss-loader',
						options: {
							plugins: function() {
								return [
									require('autoprefixer')
								];
							}
						}
					}
				],
				exclude: /node_modules/,
			},
			{
				test: /\.(jpe?g|png|gif|svg|ico)(\?.+)?$/,
				use: {
					loader: 'url-loader',
					options: {
						limit: 8192,
						name: './img/[name].[ext]'
					}
				}
			},
			{
				test: /\.(eot|otf|ttf|woff2?|svg)(\?.+)?$/,
				include: [
					path.resolve(__dirname, 'node_modules')
				],
				use: {
					loader: 'file-loader',
					options: {
						name: './fonts/[name].[ext]'
					}
				}
			}
		],
	},
	devtool: 'source-map'
}
