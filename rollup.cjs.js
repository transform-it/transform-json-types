const pkg = require("./package.json");
const fileSize = require("rollup-plugin-filesize");

const banner = `/*
 * ${pkg.name} - v${pkg.version}
 * ${pkg.description}
 * ${pkg.homepage}
 *
 * Made by ${pkg.author.name}
 * Under ${pkg.license} License
 */
`;

const config = {
  entry: "src/index.js",
  dest: "dist/index.js",
  format: "cjs",
  banner,
  plugins: [fileSize()]
};

module.exports = config;
