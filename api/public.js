const express = require("express");
const router = express.Router();
const {
  CustomerInquiry,
  Company,
  User,
  ProductOutward,
  ProductInward,
  DispatchOrder,
  Ride,
} = require("../models");
const {
  sendCustomerInquiryEmail,
  sendGeneralEmailToCompanies,
} = require("../services/mailer.service");
const { customerStatistics } = require("../services/statistics.service");
const Dao = require("../dao");
const moment = require("moment-timezone");
const { Op } = require("sequelize");
const {
  NOT_ASSIGNED,
  LOAD_DELIVERED,
  SCHEDULED,
  ON_THE_WAY,
  ARRIVED,
  LOADING_IN_PROGRESS,
  LOADING_COMPLETE,
  LOAD_IN_TRANSIT,
  REACHED,
  OFFLOADING_IN_PROGRESS,
  CANCELLED,
} = require("../enums/rideStatus");

/* POST create new customer inquery request. */
router.post("/customer-inquiry", async (req, res, next) => {
  let message = "New customer inquiry sent";
  let customerInquiry;
  try {
    customerInquiry = await CustomerInquiry.create({
      ...req.body,
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
    data: customerInquiry,
  });
});

router.get("/3478yr2387yrj23udnhiuefi", async (req, res, next) => {
  try {
    const response = await Company.findAll({
      attributes: ["id"],
      include: [
        {
          model: User,
          as: "Employees",
          attributes: ["email"],
          where: { isActive: true },
        },
      ],
    });
    response.forEach(async (Company) => {
      const customerObj = {
        emails: await Company.Employees.map((Employee) => Employee.email),
        data: await customerStatistics(Company.id),
      };
      const emails = customerObj.emails.toString();
      const data = customerObj.data;
      const subject = "Weekly Notification";
      const senderName = "Oware Technologies";
      sendGeneralEmailToCompanies(emails, data, subject, senderName);
    });
  } catch (e) {
    res.json({
      success: false,
      message: "Something Went Wrong",
      data: e.message,
    });
  }
  res.json({
    success: true,
    message: "respond with a resource",
    data: "Emails Sending..",
  });
});

router.post("/scheduled-email", async (req, res, next) => {
  let message = "New scheduled email sent";
  let where = {};

  try {
    // PI count
    where["updatedAt"] = { [Op.gte]: moment().subtract(1, "days").toDate() };
    let productInwardsCount = await ProductInward.count({
      where,
    });
    // PO count
    let productOutwardsCount = await ProductOutward.count({
      where,
    });
    // fullfilled DO count
    where["status"] = "2";
    let dispatchOrdersFullfilledCount = await DispatchOrder.count({
      where,
    });
    // partially fullfilled DO count
    where["status"] = "1";
    let dispatchOrdersPartiallyFullfilledCount = await DispatchOrder.count({
      where,
    });
    // pending DO count
    where["status"] = "0";
    let dispatchOrdersPendingCount = await DispatchOrder.count({
      where,
    });
    // CANCELLED DO count
    where["status"] = "3";
    let dispatchOrdersCancelledCount = await DispatchOrder.count({
      where,
    });
    // completed rides count
    where["status"] = LOAD_DELIVERED;
    let ridesCompletedCount = await Ride.count({
      where,
    });
    // unassigned rides count
    where["status"] = "NOT_ASSIGNED";
    let ridesUnassignedCount = await Ride.count({
      where,
    });
    // SCHEDULED rides count
    where["status"] = SCHEDULED;
    let ridesScheduledCount = await Ride.count({
      where,
    });
    // ON_THE_WAY rides count
    where["status"] = ON_THE_WAY;
    let ridesOnTheWayCount = await Ride.count({
      where,
    });
    // ARRIVED rides count
    where["status"] = ARRIVED;
    let ridesArrivedCount = await Ride.count({
      where,
    });
    // LOADING_IN_PROGRESS rides count
    where["status"] = LOADING_IN_PROGRESS;
    let ridesLoadingInProgressCount = await Ride.count({
      where,
    });
    // LOADING_COMPLETE rides count
    where["status"] = LOADING_COMPLETE;
    let ridesLoadingCompleteCount = await Ride.count({
      where,
    });
    // LOAD_IN_TRANSIT rides count
    where["status"] = LOAD_IN_TRANSIT;
    let ridesLoadingInTransitCount = await Ride.count({
      where,
    });
    // REACHED rides count
    where["status"] = REACHED;
    let ridesWaitingForOffloadingCount = await Ride.count({
      where,
    });
    // OFFLOADING_IN_PROGRESS rides count
    where["status"] = OFFLOADING_IN_PROGRESS;
    let ridesOffloadingInProgressCount = await Ride.count({
      where,
    });
    // LOAD_DELIVERED rides count
    where["status"] = LOAD_DELIVERED;
    let ridesLoadDeliveredCount = await Ride.count({
      where,
    });
    // CANCELLED rides count
    where["status"] = CANCELLED;
    let ridesLoadCancelledCount = await Ride.count({
      where,
    });

    res.json({
      success: true,
      message,
      data: {
        productInwardsCount,
        productOutwardsCount,
        dispatchOrdersFullfilledCount,
        dispatchOrdersPartiallyFullfilledCount,
        dispatchOrdersPendingCount,
        dispatchOrdersCancelledCount,
        ridesCompletedCount,
        ridesUnassignedCount,
        ridesScheduledCount,
        ridesOnTheWayCount,
        ridesArrivedCount,
        ridesLoadingInProgressCount,
        ridesLoadingCompleteCount,
        ridesLoadingInTransitCount,
        ridesWaitingForOffloadingCount,
        ridesOffloadingInProgressCount,
        ridesLoadDeliveredCount,
        ridesLoadCancelledCount,
      },
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
