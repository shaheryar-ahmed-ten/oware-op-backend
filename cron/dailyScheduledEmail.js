var cron = require("node-cron");
const {
  ProductOutward,
  ProductInward,
  DispatchOrder,
  Ride,
} = require("../models");
const moment = require("moment-timezone");
const { Op } = require("sequelize");
const {
  SCHEDULED,
  ON_THE_WAY,
  ARRIVED,
  LOADING_IN_PROGRESS,
  LOADING_COMPLETE,
  CANCELLED,
  NOT_ASSIGNED,
  COMPLETED,
  JOURNEY_IN_PROGRESS,
} = require("../enums/rideStatus");
const { sendDailyScheduledEmail } = require("../services/mailer.service");

// for 24 hours
const getActivityData = async () => {
  let where = {};
  try {
    // PI count
    where["createdAt"] = { [Op.gte]: moment().subtract(1, "days").toDate() };
    let productInwardsCount = await ProductInward.count({
      where,
    });
    // DO count
    let dispatchOrdersCount = await DispatchOrder.count({
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
    where["status"] = COMPLETED;
    let ridesCompletedCount = await Ride.count({
      where,
    });
    // unassigned rides count
    where["status"] = NOT_ASSIGNED;
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
    // JOURNEY_IN_PROGRESS rides count
    where["status"] = JOURNEY_IN_PROGRESS;
    let ridesJourneyInProgress = await Ride.count({
      where,
    });

    // CANCELLED rides count
    where["status"] = CANCELLED;
    let ridesLoadCancelledCount = await Ride.count({
      where,
    });
    return {
      productInwardsCount,
      dispatchOrdersCount,
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
      ridesLoadCancelledCount,
      ridesJourneyInProgress,
    };
  } catch (err) {
    // console.log(err);
    return err.message;
  }
};

const sendScheduledEmailData = async () => {
  let subject = "Daily Activity Digest.";
  let sentFrom = "Oware.co";
  let emails = process.env.DAILY_EMAIL_RECIPIENTS;
  try {
    const data = await getActivityData();

    return await sendDailyScheduledEmail(emails, data, subject, sentFrom);
  } catch (err) {
    console.log(err);
    return err.message;
  }
};

module.exports = cron.schedule(process.env.DAILY_CRON_TIME_EMAIL, () => {
  sendScheduledEmailData()
    .then((res) => {
      if (!res.success) {
        console.log("Email excecution failed.");
      } else {
        console.log("Email excution done.");
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
