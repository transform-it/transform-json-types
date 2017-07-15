const fileSize = require("rollup-plugin-filesize");
const banner = require("./banner");

const config = {
  entry: "src/index.js",
  dest: "dist/lunar.es.js",
  format: "es",
  banner,
  plugins: [fileSize()]
};

module.exports = config;
