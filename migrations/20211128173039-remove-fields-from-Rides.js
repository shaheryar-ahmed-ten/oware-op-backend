"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.removeColumn("Rides", "dropoffCityId");
    await queryInterface.removeColumn("Rides", "dropoffLocation");
    await queryInterface.removeColumn("Rides", "dropoffDate");
    await queryInterface.removeColumn("Rides", "pocName");
    await queryInterface.removeColumn("Rides", "pocNumber");
    await queryInterface.removeColumn("Rides", "currentLocation");
    await queryInterface.removeColumn("Rides", "memo");
    await queryInterface.removeColumn("Rides", "manifestId");
    await queryInterface.removeColumn("Rides", "dropoffAddress");
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.addColumn("Rides", "dropoffCityId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Cities", // name of Target model
        key: "id", // key in Target model that we're referencing
      },
    });
    await queryInterface.addColumn("Rides", "dropoffLocation", {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await queryInterface.addColumn("Rides", "dropoffDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("Rides", "pocName", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Rides", "pocNumber", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Rides", "currentLocation", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Rides", "memo", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("Rides", "manifestId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Files", // name of Target model
        key: "id", // key in Target model that we're referencing
      },
    });
  },
};
