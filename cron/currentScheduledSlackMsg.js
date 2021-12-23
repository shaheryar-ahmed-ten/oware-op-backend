var cron = require('node-cron');
const { ProductOutward, ProductInward, DispatchOrder, Ride } = require("../models");
const moment = require("moment-timezone");
const { Op } = require("sequelize");
const { NOT_ASSIGNED, SCHEDULED, ON_THE_WAY, ARRIVED, LOADING_IN_PROGRESS, LOADING_COMPLETE, JOURNEY_IN_PROGRESS, COMPLETED, CANCELLED } = require("../enums/rideStatus");
const axios = require("axios");

// for 24 hours
const getActivityData = async () => {
    let where = {};
    try {
        // PI count
        where["createdAt"] = { [Op.gte]: moment().subtract(1800, 'seconds').toDate() }
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
        // fullfilled DO count
        where["status"] = '2'
        let dispatchOrdersFullfilledCount = await DispatchOrder.count({
            where,
        });
        // partially fullfilled DO count
        where["status"] = '1'
        let dispatchOrdersPartiallyFullfilledCount = await DispatchOrder.count({
            where,
        });
        // pending DO count
        where["status"] = '0'
        let dispatchOrdersPendingCount = await DispatchOrder.count({
            where,
        });
        // CANCELLED DO count
        where["status"] = '3'
        let dispatchOrdersCancelledCount = await DispatchOrder.count({
            where,
        });
        // completed rides count
        where['status'] = COMPLETED
        let ridesCompletedCount = await Ride.count({
            where,
        });
        // unassigned rides count
        where['status'] = NOT_ASSIGNED
        let ridesUnassignedCount = await Ride.count({
            where,
        });
        // SCHEDULED rides count
        where['status'] = SCHEDULED
        let ridesScheduledCount = await Ride.count({
            where,
        });
        // ON_THE_WAY rides count
        where['status'] = ON_THE_WAY
        let ridesOnTheWayCount = await Ride.count({
            where,
        });
        // Journey_In_Progress rides count
        where['status'] = JOURNEY_IN_PROGRESS
        let ridesJourneyInProgress = await Ride.count({
            where,
        });
        // ARRIVED rides count
        where['status'] = ARRIVED
        let ridesArrivedCount = await Ride.count({
            where,
        });
        // LOADING_IN_PROGRESS rides count
        where['status'] = LOADING_IN_PROGRESS
        let ridesLoadingInProgressCount = await Ride.count({
            where,
        });
        // LOADING_COMPLETE rides count
        where['status'] = LOADING_COMPLETE
        let ridesLoadingCompleteCount = await Ride.count({
            where,
        });
        // CANCELLED rides count
        where['status'] = CANCELLED
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
            ridesCount,
            ridesCompletedCount,
            ridesUnassignedCount,
            ridesScheduledCount,
            ridesOnTheWayCount,
            ridesArrivedCount,
            ridesLoadingInProgressCount,
            ridesLoadingCompleteCount,
            ridesLoadCancelledCount,
            ridesJourneyInProgress
        }

    } catch (error) {
        console.log(err)
        return err.message
    }
}

const sendDigestOnSlack = async () => {
    try {
        const hook = `${process.env.CURRENT_SLACK_HOOK}`;

        const data = await getActivityData()
        const slackBody = {
            text: "Current Activity Digest.",
            attachments: [
                {
                    color: 'good',
                    text: `*Inwards Created* : ${data.productInwardsCount}`
                },
                {
                    color: 'good',
                    text: `*Orders Created* : ${data.dispatchOrdersCount}`
                },
                {
                    color: 'good',
                    text: `*Orders Cancelled* : ${data.dispatchOrdersCancelledCount}`
                },
                {
                    color: 'good',
                    text: `*Outwards Created* : ${data.productOutwardsCount}`
                },
                {
                    color: 'good',
                    text: `*Rides Created* : ${data.ridesCount}`
                },
                {
                    color: 'good',
                    text: `*Rides Cancelled* : ${data.ridesLoadCancelledCount}`
                },
            ]
        }

        return axios.post(`https://hooks.slack.com/services/${hook}`, slackBody)


    } catch (err) {
        console.log(err)
        return {
            success: false,
            message: err
        }
    }
}

module.exports = cron.schedule(process.env.CURRENT_CRON_TIME_SLACK, () => {
    sendDigestOnSlack()
        .then((res) => {
            console.log("Current activity Slack message sent successfully")
        })
        .catch((err) => {
            console.log(err)
        })
});