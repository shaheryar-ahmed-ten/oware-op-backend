"use strict";
const {
  DISPATCH_ORDER: { STATUS }
} = require("../enums");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("DispatchOrders", "status", {
      type: Sequelize.STRING,
      defaultValue: STATUS.PENDING,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("DispatchOrders", "status");
  }
};
