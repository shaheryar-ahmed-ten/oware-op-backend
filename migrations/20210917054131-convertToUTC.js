"use strict";
const { sequelize } = require("../models");
const momenttz = require("moment-timezone");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn("StockAdjustments", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("StockAdjustments", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("ActivityLogs", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("ActivityLogs", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("ActivitySourceType", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("ActivitySourceType", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("AdjustmentInventories", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("AdjustmentInventories", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Areas", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Areas", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Brands", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Brands", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("CarMakes", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("CarMakes", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("CarModels", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("CarModels", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Cars", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Cars", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Categories", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Categories", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Cities", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Cities", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Companies", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Companies", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("CustomerInqueries", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("CustomerInqueries", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("DispatchOrders", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("DispatchOrders", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Drivers", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Drivers", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Files", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("StockAdjustments", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("StockAdjustments", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("StockAdjustments", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("StockAdjustments", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("StockAdjustments", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("StockAdjustments", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("StockAdjustments", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("StockAdjustments", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("StockAdjustments", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn("StockAdjustments", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
  },
};
