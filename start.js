const browserSync = require("browser-sync");
const app = require("./app");
///var http = require("http");

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);
const isProduction = "production" === process.env.NODE_ENV;

const server = app.listen(port, listening);

function listening(err) {
  console.log(`Express is running on port ${server.address().port}`);
  if (!isProduction) {
    if (err) console.log(err);
    // https://ponyfoo.com/articles/a-browsersync-primer#inside-a-node-application
    browserSync({
      files: ["**/*.{html,js,css,pug}"],
      online: false,
      open: false,
      port: port + 1,
      proxy: "localhost:" + port,
      ui: false,
    });
  }
}
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
