const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const fs = require("fs");
const morganBody = require("morgan-body");
const app = express();
var bodyParser = require("body-parser");
const dailyEmailTask = require("./cron/dailyScheduledEmail")
const currentEmailTask = require("./cron/currentScheduledEmail")
const dailySlackTask = require("./cron/dailyScheduledSlackMsg")
const currentSlackTask = require("./cron/currentScheduledSlackMsg")

//success and error response formatter
app.use(require("./middlewares/response"));

// const { isLoggedIn, checkPermission } = require('./services/auth.service');
const { syncPermissions } = require("./services/permission.service");
const apiRouter = require("./api");

var accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });
morganBody(app, {
  // .. other settings
  noColors: true,
  stream: accessLogStream,
});

app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(express.json());
// view engine setup (not required as we're only serving rest APIs)
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api/v1/", apiRouter);

// Serve static files for frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use("/api/v1", function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    success: false,
    message: "error",
  });
});

syncPermissions();

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.redirect("/");
});

app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(express.json());

currentEmailTask.start();
currentSlackTask.start();

dailyEmailTask.start();
dailySlackTask.start();

module.exports = app;
