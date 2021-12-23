"use strict";
const RIDE_STATUSES = require("../enums/rideStatus.js");
const DROPOFF_STATUSES = require("../enums/dropoffStatus.js");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.changeColumn("Rides", "status", {
      type: Sequelize.STRING,
      allowNull: false,
      DefaultValue: "Not Assigned",
    });
    await queryInterface.changeColumn("RideDropoffs", "status", {
      type: Sequelize.STRING,
      allowNull: false,
      DefaultValue: "Dropoff Scheduled",
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn("Rides", {
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
    await queryInterface.changeColumn("RideDropoffs", {
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },
};
