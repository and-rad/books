const path = require('path')

module.exports = {
	mode: 'production',
	entry: {
		'app': [
			path.join(__dirname, 'src', 'core.js'),
			path.join(__dirname, 'src', 'ui.js'),
			path.join(__dirname, 'src', 'backend.js'),
		],
	},
	output: {
		path: path.resolve(__dirname, './js'),
		publicPath: '/js/',
		filename: '[name].js',
		chunkFilename: 'vendor.js',
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.scss$/,
				use: ['style-loader', 'css-loader', 'sass-loader'],
			},
			{
				test: /\.(png|jpg|gif|svg)$/,
				loader: 'url-loader',
				options: {
					name: '[name].[ext]?[hash]',
					limit: 8192,
				},
			},
		],
	},
	optimization: {
		splitChunks: {
			chunks: 'all',
		},
	},
}
