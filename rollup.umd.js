const pkg = require('./package.json')
const buble = require('rollup-plugin-buble')
const fileSize = require('rollup-plugin-filesize')

const banner = `/*
 * ${pkg.name} - v${pkg.version}
 * ${pkg.description}
 * ${pkg.homepage}
 *
 * Made by ${pkg.author.name}
 * Under ${pkg.license} License
 */
`

const config = {
  entry: 'src/lunar.js',
  dest: 'dist/lunar.umd.js',
  moduleName: pkg.name,
  format: 'umd',
  banner,
  plugins: [buble(), fileSize()]
}

module.exports = config
