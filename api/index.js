const express = require('express');
const router = express.Router();
const userRouter = require('./user');
const publicRouter = require('./public');
const companyRouter = require('./company');
const categoryRouter = require('./category');
const uomRouter = require('./uom');
const brandRouter = require('./brand');
const warehouseRouter = require('./warehouse');
const productRouter = require('./product');
const productInwardRouter = require('./productInward');
const dispatchOrderRouter = require('./dispatchOrder');
const productOutwardRouter = require('./productOutward');
const inventoryRouter = require('./inventory');
const driverRouter = require('./driver');
const customerInquiryRouter = require('./customerInquiry');

const { isLoggedIn, checkPermission } = require('../services/auth.service');
const { PERMISSIONS } = require('../enums');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.json({
    success: true,
    message: 'Welcome!'
  });
});

router.use('/user', userRouter);
router.use('/public', publicRouter);
router.use('/customer', isLoggedIn, checkPermission(PERMISSIONS.OPS_CUSTOMER_FULL), companyRouter);
router.use('/category', isLoggedIn, checkPermission(PERMISSIONS.OPS_CATEGORY_FULL), categoryRouter);
router.use('/customer-inquiry', isLoggedIn, checkPermission(PERMISSIONS.OPS_CUSTOMERINQUIRY_FULL), customerInquiryRouter);
router.use('/uom', isLoggedIn, checkPermission(PERMISSIONS.OPS_UOM_FULL), uomRouter);
router.use('/brand', isLoggedIn, checkPermission(PERMISSIONS.OPS_BRAND_FULL), brandRouter);
router.use('/warehouse', isLoggedIn, checkPermission(PERMISSIONS.OPS_WAREHOUSE_FULL), warehouseRouter);
router.use('/product', isLoggedIn, checkPermission(PERMISSIONS.OPS_PRODUCT_FULL), productRouter);
router.use('/product-inward', isLoggedIn, checkPermission(PERMISSIONS.OPS_PRODUCTINWARD_FULL), productInwardRouter);
router.use('/dispatch-order', isLoggedIn, checkPermission(PERMISSIONS.OPS_DISPATCHORDER_FULL), dispatchOrderRouter);
router.use('/product-outward', isLoggedIn, checkPermission(PERMISSIONS.OPS_PRODUCTOUTWARD_FULL), productOutwardRouter);
router.use('/inventory', isLoggedIn, checkPermission(PERMISSIONS.OPS_INVENTORY_FULL), inventoryRouter);

router.use('/driver', isLoggedIn, checkPermission(PERMISSIONS.OPS_INVENTORY_FULL), driverRouter);


module.exports = router;
