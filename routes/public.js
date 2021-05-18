const express = require("express");
const router = express.Router();
const { CustomerInquiry } = require("../models");

/* POST create new customer inquery request. */
router.post("/customer-inquiry", async (req, res, next) => {
  let message = "New customer inquiry sent";
  let customerInquiry;
  try {
    customerInquiry = await CustomerInquiry.create({
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
    data: customerInquiry,
  });
});

module.exports = router;
