const express = require("express");
const router = express.Router();
const userRouter = require("./user");
const publicRouter = require("./public");
const companyRouter = require("./company");
const categoryRouter = require("./category");
const uomRouter = require("./uom");
const brandRouter = require("./brand");
const warehouseRouter = require("./warehouse");
const productRouter = require("./product");
const productInwardRouter = require("./productInward");
const dispatchOrderRouter = require("./dispatchOrder");
const productOutwardRouter = require("./productOutward");
const inventoryRouter = require("./inventory");
const customerInquiryRouter = require("./customerInquiry");
const driverRouter = require("./driver");
const vehicleRouter = require("./vehicle");
const rideRouter = require("./ride");
const uploadRouter = require("./upload");
const previewRouter = require("./preview");
const stockAdjustment = require("./stockAdjustment/routes");
const addActivityLog = require("../middlewares/activityLog");

const { isLoggedIn, checkPermission } = require("../services/auth.service");
const { PERMISSIONS } = require("../enums");

/* GET home page. */
router.get("/", (req, res, next) => {
  res.json({
    success: true,
    message: "Welcome!",
  });
});

router.use("/user", userRouter);
router.use("/public", publicRouter);
router.use("/company", isLoggedIn, checkPermission(PERMISSIONS.OPS_CUSTOMER_FULL), companyRouter);
router.use("/category", isLoggedIn, checkPermission(PERMISSIONS.OPS_CATEGORY_FULL), categoryRouter);
router.use(
  "/customer-inquiry",
  isLoggedIn,
  checkPermission(PERMISSIONS.OPS_CUSTOMERINQUIRY_FULL),
  customerInquiryRouter
);
router.use("/uom", isLoggedIn, checkPermission(PERMISSIONS.OPS_UOM_FULL), addActivityLog, uomRouter);
router.use("/brand", isLoggedIn, checkPermission(PERMISSIONS.OPS_BRAND_FULL), addActivityLog, brandRouter);
router.use("/warehouse", isLoggedIn, checkPermission(PERMISSIONS.OPS_WAREHOUSE_FULL), addActivityLog, warehouseRouter);
router.use("/product", isLoggedIn, checkPermission(PERMISSIONS.OPS_PRODUCT_FULL), addActivityLog, productRouter);
router.use(
  "/product-inward",
  isLoggedIn,
  checkPermission(PERMISSIONS.OPS_PRODUCTINWARD_FULL),
  addActivityLog,
  productInwardRouter
);
router.use(
  "/dispatch-order",
  isLoggedIn,
  checkPermission(PERMISSIONS.OPS_DISPATCHORDER_FULL),
  addActivityLog,
  dispatchOrderRouter
);
router.use(
  "/product-outward",
  isLoggedIn,
  checkPermission(PERMISSIONS.OPS_PRODUCTOUTWARD_FULL),
  addActivityLog,
  productOutwardRouter
);
router.use("/inventory", isLoggedIn, checkPermission(PERMISSIONS.OPS_INVENTORY_FULL), addActivityLog, inventoryRouter);
router.use("/driver", isLoggedIn, checkPermission(PERMISSIONS.OPS_INVENTORY_FULL), addActivityLog, driverRouter);
router.use("/vehicle", isLoggedIn, checkPermission(PERMISSIONS.OPS_INVENTORY_FULL), addActivityLog, vehicleRouter);
router.use("/ride", isLoggedIn, checkPermission(PERMISSIONS.OPS_INVENTORY_FULL), addActivityLog, rideRouter);
router.use("/upload", isLoggedIn, checkPermission(PERMISSIONS.OPS_INVENTORY_FULL), addActivityLog, uploadRouter);
router.use(
  "/inventory-wastages",
  isLoggedIn,
  checkPermission(PERMISSIONS.OPS_INVENTORY_FULL),
  addActivityLog,
  stockAdjustment
);
router.use("/preview", previewRouter);

module.exports = router;
