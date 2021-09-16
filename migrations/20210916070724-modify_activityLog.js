"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("ActivityLogs", "activityType", { type: Sequelize.STRING });
    await queryInterface.addColumn("ActivitySourceTypes", "hasInternalIdForBusiness", { type: Sequelize.BOOLEAN });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("ActivityLogs", "activityType"),
      await queryInterface.removeColumn("ActivitySourceTypes", "hasInternalIdForBusiness");
  },
};
