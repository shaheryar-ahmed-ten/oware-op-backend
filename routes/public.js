const express = require("express");
const router = express.Router();
const { CustomerInquiry, Customer , User} = require("../models");
const { sendCustomerInquiryEmail } = require('../services/mailer.service');

/* POST create new customer inquery request. */
router.post("/customer-inquiry", async (req, res, next) => {
  let message = "New customer inquiry sent";
  let customerInquiry;
  try {
    customerInquiry = await CustomerInquiry.create({
      ...req.body
    });
    sendCustomerInquiryEmail(customerInquiry);
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
  res.json({
    success: true,
    message,
    data: customerInquiry
  });
});

router.get('/3478yr2387yrj23udnhiuefi', async (req, res, next) => {
  let where = {
  };
  const response = await Customer.findAll({
    attributes:['id'],
    include:[{model:User,attributes:['email']}],
    group:['id']
  });
  response.forEach(Customer => {
    console.log(Customer.User.email)
  });

  res.json({
    success: true,
    message: 'respond with a resource',
    data: response,
  });
});

module.exports = router;
