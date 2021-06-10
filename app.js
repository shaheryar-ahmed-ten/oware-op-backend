const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const fs = require('fs')


const { isLoggedIn, checkPermission } = require('./services/auth.service');
const { syncPermissions } = require('./services/permission.service');
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const publicRouter = require('./routes/public');
const companyRouter = require('./routes/company');
const categoryRouter = require('./routes/category');
const uomRouter = require('./routes/uom');
const brandRouter = require('./routes/brand');
const warehouseRouter = require('./routes/warehouse');
const productRouter = require('./routes/product');
const productInwardRouter = require('./routes/productInward');
const dispatchOrderRouter = require('./routes/dispatchOrder');
const productOutwardRouter = require('./routes/productOutward');
const inventoryRouter = require('./routes/inventory');
const customerInquiryRouter = require('./routes/customerInquiry');

const { PERMISSIONS } = require('./enums');


const app = express();

var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
// setup the logger
app.use(logger('combined', { stream: accessLogStream }))
// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1/', indexRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/public', publicRouter);
app.use('/api/v1/customer', isLoggedIn, checkPermission(PERMISSIONS.OPS_CUSTOMER_FULL), companyRouter);
app.use('/api/v1/category', isLoggedIn, checkPermission(PERMISSIONS.OPS_CATEGORY_FULL), categoryRouter);
app.use('/api/v1/customer-inquiry', isLoggedIn, checkPermission(PERMISSIONS.OPS_CUSTOMERINQUIRY_FULL), customerInquiryRouter);
app.use('/api/v1/uom', isLoggedIn, checkPermission(PERMISSIONS.OPS_UOM_FULL), uomRouter);
app.use('/api/v1/brand', isLoggedIn, checkPermission(PERMISSIONS.OPS_BRAND_FULL), brandRouter);
app.use('/api/v1/warehouse', isLoggedIn, checkPermission(PERMISSIONS.OPS_WAREHOUSE_FULL), warehouseRouter);
app.use('/api/v1/product', isLoggedIn, checkPermission(PERMISSIONS.OPS_PRODUCT_FULL), productRouter);
app.use('/api/v1/product-inward', isLoggedIn, checkPermission(PERMISSIONS.OPS_PRODUCTINWARD_FULL), productInwardRouter);
app.use('/api/v1/dispatch-order', isLoggedIn, checkPermission(PERMISSIONS.OPS_DISPATCHORDER_FULL), dispatchOrderRouter);
app.use('/api/v1/product-outward', isLoggedIn, checkPermission(PERMISSIONS.OPS_PRODUCTOUTWARD_FULL), productOutwardRouter);
app.use('/api/v1/inventory', isLoggedIn, checkPermission(PERMISSIONS.OPS_INVENTORY_FULL), inventoryRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use('/api/v1', function (err, req, res, next) {
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

syncPermissions();

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.redirect('/');
});

module.exports = app;
