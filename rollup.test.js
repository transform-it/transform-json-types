const buble = require('rollup-plugin-buble')

const config = {
  entry: 'test/index.test.js',
  dest: 'test/bundle.test.js',
  format: 'cjs',
  plugins: [buble()]
}

module.exports = config
