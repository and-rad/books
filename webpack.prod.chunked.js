const path = require('path')

module.exports = {
	mode: 'production',
	entry: {
		'app': path.join(__dirname, 'src', 'app.js'),
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
