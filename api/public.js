const express = require("express");
const router = express.Router();
const { CustomerInquiry, Company, User } = require("../models");
const { sendCustomerInquiryEmail, sendGeneralEmailToCompanys } = require('../services/mailer.service');
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
  try {
    const response = await Company.findAll({
      attributes: ['id'],
      include: [{
        model: User,
        as: 'Employees',
        attributes: ['email'],
        where: { isActive: true }
      }],
    });
    response.forEach(async (Company) => {
      const customerObj = {
        emails: await Company.Employees.map(Employee => Employee.email),
        data: await statisticsOfCustomer(Company.id)
      };
      const emails = customerObj.emails.toString();
      const data = JSON.stringify(customerObj.data);
      const subject = 'Weekly Notification';
      const senderName = 'Oware Technologies';
      sendGeneralEmailToCompanys(emails, data, subject, senderName)
    });
  } catch (e) {
    res.json({
      success: false,
      message: 'Something Went Wrong',
      data: e.message,
    });
  }
  res.json({
    success: true,
    message: 'respond with a resource',
    data: 'Emails Sending..',
  });
});

module.exports = router;
