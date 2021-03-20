const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
var cors = require('cors')

const authService = require('./services/auth.service');
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const customerRouter = require('./routes/customer');
const categoryRouter = require('./routes/category');
const uomRouter = require('./routes/uom');
const brandRouter = require('./routes/brand');
const warehouseRouter = require('./routes/warehouse');
const productRouter = require('./routes/product');
const productInwardRouter = require('./routes/productInward');
const dispatchOrderRouter = require('./routes/dispatchOrder');

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/customer', authService.isLoggedIn, customerRouter);
app.use('/category', authService.isLoggedIn, categoryRouter);
app.use('/uom', authService.isLoggedIn, uomRouter);
app.use('/brand', authService.isLoggedIn, brandRouter);
app.use('/warehouse', authService.isLoggedIn, warehouseRouter);
app.use('/product', authService.isLoggedIn, productRouter);
app.use('/product-inward', authService.isLoggedIn, productInwardRouter);
app.use('/dispatch-order', authService.isLoggedIn, dispatchOrderRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    success: false,
    message: 'error'
  });
});

module.exports = app;
