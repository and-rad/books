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
	optimization: {
		splitChunks: {
			chunks: 'all',
		},
	},
}
