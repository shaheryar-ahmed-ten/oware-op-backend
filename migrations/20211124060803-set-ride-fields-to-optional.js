"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Rides", "driverId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn("Rides", "vehicleId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Rides", "driverId", {
      allowNull: false,
    });
    await queryInterface.changeColumn("Rides", "vehicleId", {
      allowNull: false,
    });
  },
};
