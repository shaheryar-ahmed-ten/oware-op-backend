"use strict";
const Dao = require("../dao");
const { Ride, RideDropoff, RideProduct } = require("../models");
const DROPOFF_STATUSES = require("../enums/dropoffStatus.js");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
        Update Rides set dropoffDate = CURRENT_TIMESTAMP() where dropoffDate like "0000-00-00 00:00:00"
      `);

    const rides = await queryInterface.sequelize.query(`SELECT * FROM Rides AS Ride WHERE Ride.deletedAt IS NULL`, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    for (const ride of rides) {
      const dropoffResponse = await RideDropoff.create({
        rideId: ride.id,
        status: DROPOFF_STATUSES.DROPOFF_SCHEDULED,
        outwardId: null,
        cityId: ride.dropoffCityId || 1,
        address: ride.dropoffAddress || "",
        location: ride.dropoffLocation,
        dateTime: ride.dropoffDate,
        status: ride.status,
        pocName: ride.pocName,
        pocNumber: ride.pocNumber,
        currentLocation: ride.currentLocation,
        memo: ride.memo,
        manifestId: ride.manifestId,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
