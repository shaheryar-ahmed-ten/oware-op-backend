"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("Rides", "pickupLocation", {
      type: Sequelize.JSON,
      allowNull: true,
    }),
      await queryInterface.addColumn("Rides", "dropoffLocation", {
        type: Sequelize.JSON,
        allowNull: true,
      });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn("Rides", "pickupLocation");
    await queryInterface.removeColumn("Rides", "dropoffLocation");
  },
};
