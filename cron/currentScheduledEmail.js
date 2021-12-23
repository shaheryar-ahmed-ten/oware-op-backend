var cron = require("node-cron");
const { ProductOutward, ProductInward, DispatchOrder, Ride } = require("../models");
const moment = require("moment-timezone");
const { Op } = require("sequelize");
const {
    CANCELLED,
} = require("../enums/rideStatus");
const { sendCurrentScheduledEmail } = require("../services/mailer.service");

// for 24 hours
const getActivityData = async () => {
    let where = {};
    try {
        // PI count
        where["createdAt"] = { [Op.gte]: moment().subtract(1800, 'seconds').toDate() };
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
        // total rides count
        let ridesCount = await Ride.count({
            where,
        });
        // CANCELLED DO count
        where["status"] = "3";
        let dispatchOrdersCancelledCount = await DispatchOrder.count({
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
            ridesCount,
            dispatchOrdersCancelledCount,
            ridesLoadCancelledCount,
        };
    } catch (err) {
        console.log(err);
        return err.message;
    }
};

const sendScheduledEmailData = async () => {
    let subject = "Current Activity Digest.";
    let sentFrom = "Oware.co";
    let emails = process.env.CURRENT_EMAIL_RECIPIENTS;
    try {
        const data = await getActivityData();
        
        return await sendCurrentScheduledEmail(emails, data, subject, sentFrom);
    } catch (err) {
        // console.log(err);
        return err.message;
    }
};

module.exports = cron.schedule(process.env.CURRENT_CRON_TIME_EMAIL, () => {
    sendScheduledEmailData()
        .then((res) => {
            if (!res.success) {
                console.log("Current Email excecution failed.");
            } else {
                console.log("Current Email excution done.");
            }
        })
        .catch((err) => {
            console.log(err);
        });
});
