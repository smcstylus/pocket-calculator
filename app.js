//const browserSync = require("browser-sync");
//const envDot = require("config");
const compression = require("compression");
var createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const indexRouter = require("./routes/index");
//const __dirname = path.resolve();

const app = express();
require("dotenv").config();
const router = express.Router();

// you can conditionally add routes and behaviour based on environment
const isProduction = "production" === process.env.NODE_ENV ? true : false;

app.set("etag", isProduction);
app.use((req, res, next) => {
  res.removeHeader("X-Powered-By");
  next();
});
// compress all responses
app.use(compression());

// Static files
app.use(express.static(path.join(__dirname, "/public")));
//app.use('/bootstrap', express.static(path.join(__dirname, '/node_modules/bootstrap/dist')));
//app.use('/jquery', express.static(path.join(__dirname, '/node_modules/jquery/dist')));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// create "middleware"
app.use(morgan("combined"));
//app.use(express.json());
//app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  let resStatus = err.status || 500;
  res.status(resStatus);
  if (!isProduction) {
    res.render("error", { title: "Error " + resStatus, error: err });

    console.log(err.message);
  }
});

module.exports = app;
