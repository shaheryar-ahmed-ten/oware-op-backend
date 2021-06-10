const express = require("express");
const router = express.Router();
const { CustomerInquiry, Company, User } = require("../models");
const { sendCustomerInquiryEmail, sendGeneralEmailToCustomers } = require('../services/mailer.service');
const { statisticsOfCustomer } = require("../services/customerStatistics.service");

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
  const response = await Company.findAll({
    attributes: ['id'],
    include: [{ model: User, as: 'Employees', attributes: ['email'] }],
  });
  response.forEach(async (Company) => {
    // sendGeneralEmailToCompanys(Company.User.email)
    //console.log(Company.Employees[0].email)
    Company.Employees.forEach(Employee=>console.log(Employee.email))
    const data = await statisticsOfCustomer(Company.id)
    //console.log(data)
  });

  res.json({
    success: true,
    message: 'respond with a resource',
    data: response,
  });
});

module.exports = router;
