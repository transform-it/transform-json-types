const banner = require("./banner");
const pkg = require("./package.json");
const buble = require("rollup-plugin-buble");
const fileSize = require("rollup-plugin-filesize");
const pascalCase = require("pascal-case");

const config = {
  entry: "src/index.js",
  dest: "dist/lunar.umd.js",
  moduleName: pascalCase(pkg.name),
  format: "umd",
  banner,
  plugins: [buble(), fileSize()]
};

module.exports = config;
