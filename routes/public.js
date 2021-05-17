const express = require("express");
const router = express.Router();
const { CustomerInquery } = require("../models");

/* POST create new customer inquery request. */
router.post("/customer-inquery", async (req, res, next) => {
  let message = "New customer inquery sent";
  let customerInquery;
  try {
    customerInquery = await CustomerInquery.create({
      ...req.body,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
  res.json({
    success: true,
    message,
    data: customerInquery,
  });
});

module.exports = router;
