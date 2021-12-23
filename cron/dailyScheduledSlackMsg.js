var cron = require('node-cron');
const { ProductOutward, ProductInward, DispatchOrder, Ride } = require("../models");
const moment = require("moment-timezone");
const { Op } = require("sequelize");
const { LOAD_DELIVERED, SCHEDULED, ON_THE_WAY, ARRIVED, LOADING_IN_PROGRESS, LOADING_COMPLETE, LOAD_IN_TRANSIT, REACHED, OFFLOADING_IN_PROGRESS, CANCELLED } = require("../enums/rideStatus");
const axios = require("axios");

// for 24 hours
const getActivityData = async () => {
    let where = {};
    try {
        // PI count
        where["updatedAt"] = { [Op.gte]: moment().subtract(1, 'days').toDate() }
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
        where['status'] = LOAD_DELIVERED
        let ridesCompletedCount = await Ride.count({
            where,
        });
        // unassigned rides count
        where['status'] = 'UNASSIGNED'
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
        // LOAD_IN_TRANSIT rides count
        where['status'] = LOAD_IN_TRANSIT
        let ridesLoadingInTransitCount = await Ride.count({
            where,
        });
        // REACHED rides count
        where['status'] = REACHED
        let reached = await Ride.count({
            where,
        });
        // OFFLOADING_IN_PROGRESS rides count
        where['status'] = OFFLOADING_IN_PROGRESS
        let ridesOffloadingInProgressCount = await Ride.count({
            where,
        });
        // LOAD_DELIVERED rides count
        where['status'] = LOAD_DELIVERED
        let ridesLoadDeliveredCount = await Ride.count({
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
            ridesCompletedCount,
            ridesUnassignedCount,
            ridesScheduledCount,
            ridesOnTheWayCount,
            ridesArrivedCount,
            ridesLoadingInProgressCount,
            ridesLoadingCompleteCount,
            ridesLoadingInTransitCount,
            reached,
            ridesOffloadingInProgressCount,
            ridesLoadDeliveredCount,
            ridesLoadCancelledCount
        }

    } catch (error) {
        console.log(err)
        return err.message
    }
}

const sendDigestOnSlack = async () => {
    try {
        const hook = `${process.env.DAILY_SLACK_HOOK}`;

        const data = await getActivityData()
        const slackBody = {
            text: "Daily Activity Digest.",
            attachments: [
                {
                    color: 'good',
                    text: `*Total Inwards* : ${data.productInwardsCount}`
                },
                {
                    color: 'good',
                    text: `*Total Orders* : ${data.dispatchOrdersCount}`
                },
                {
                    color: 'good',
                    text: `*Total Outwards* : ${data.productOutwardsCount}`
                },
                {
                    color: 'good',
                    text: `*Total Rides (completed)* : ${data.ridesCompletedCount}`
                },
                // orders
                {
                    color: 'good',
                    text: `*Total Fullfilled (Orders)* : ${data.dispatchOrdersFullfilledCount}`
                },
                {
                    color: 'good',
                    text: `*Total Partially Fullfilled (Orders)* : ${data.dispatchOrdersPartiallyFullfilledCount}`
                },
                {
                    color: 'good',
                    text: `*Total Pending (Orders)* : ${data.dispatchOrdersPendingCount}`
                },
                {
                    color: 'good',
                    text: `*Total Cancelled (Orders)* : ${data.dispatchOrdersCancelledCount}`
                },
                // rides/tips
                {
                    color: 'good',
                    text: `*Total Not Assigned (Trip/Ride)* : ${data.ridesUnassignedCount}`
                },
                {
                    color: 'good',
                    text: `*Total Scheduled (Trip/Ride)* : ${data.ridesScheduledCount}`
                },
                {
                    color: 'good',
                    text: `*Total On The Way (Trip/Ride)* : ${data.ridesOnTheWayCount}`
                },
                {
                    color: 'good',
                    text: `*Total Arrived (Trip/Ride)* : ${data.ridesArrivedCount}`
                },
                {
                    color: 'good',
                    text: `*Total Loading In Progress (Trip/Ride)* : ${data.ridesLoadingInProgressCount}`
                },
                {
                    color: 'good',
                    text: `*Total Load In Transit (Trip/Ride)* : ${data.ridesLoadingInTransitCount}`
                },
                {
                    color: 'good',
                    text: `*Total Waiting For Offloading (Trip/Ride)* : ${data.reached}`
                },
                {
                    color: 'good',
                    text: `*Total Offloading In Progress (Trip/Ride)* : ${data.ridesOffloadingInProgressCount}`
                },
                {
                    color: 'good',
                    text: `*Total Load Delivered (Trip/Ride)* : ${data.ridesLoadDeliveredCount}`
                },
                {
                    color: 'good',
                    text: `*Total Cancelled (Trip/Ride)* : ${data.ridesLoadCancelledCount}`
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

module.exports = cron.schedule(process.env.DAILY_CRON_TIME_SLACK, () => {
    sendDigestOnSlack()
        .then((res) => {
            console.log("Slack message sent successfully")
        })
        .catch((err) => {
            console.log(err)
        })
});