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
    await queryInterface.changeColumn("StockAdjustments", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
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
    await queryInterface.changeColumn("ActivityLogs", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("ActivitySourceTypes", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("ActivitySourceTypes", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("ActivitySourceTypes", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
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
    await queryInterface.changeColumn("AdjustmentInventories", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
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
    await queryInterface.changeColumn("Areas", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
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
    await queryInterface.changeColumn("Brands", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
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
    await queryInterface.changeColumn("CarMakes", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
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
    await queryInterface.changeColumn("CarModels", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
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
    await queryInterface.changeColumn("Cars", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
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
    await queryInterface.changeColumn("Categories", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
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
    await queryInterface.changeColumn("Cities", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
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
    await queryInterface.changeColumn("Companies", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("CustomerInquiries", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("CustomerInquiries", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("CustomerInquiries", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
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
    await queryInterface.changeColumn("DispatchOrders", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
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
    await queryInterface.changeColumn("Drivers", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Files", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Files", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Files", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Inventories", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Inventories", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Inventories", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("InwardGroups", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("InwardGroups", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("InwardGroups", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("OutwardGroups", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("OutwardGroups", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("OutwardGroups", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("PermissionAccesses", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("PermissionAccesses", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("PermissionAccesses", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Permissions", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Permissions", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Permissions", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("ProductInwards", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("ProductInwards", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("ProductInwards", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("ProductOutwards", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("ProductOutwards", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("ProductOutwards", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Products", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Products", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Products", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("RideProducts", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("RideProducts", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("RideProducts", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Rides", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Rides", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Rides", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("UOMs", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("UOMs", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("UOMs", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Users", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Users", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Users", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("VehicleTypes", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("VehicleTypes", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("VehicleTypes", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("VerificationCodes", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("VerificationCodes", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("VerificationCodes", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Warehouses", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Warehouses", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Warehouses", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("WastagesTypes", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("WastagesTypes", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("WastagesTypes", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Zones", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Zones", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("Zones", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
      defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    });
    await queryInterface.changeColumn("DispatchOrders", "shipmentDate", {
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
    await queryInterface.changeColumn("StockAdjustments", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("StockAdjustments", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("ActivityLogs", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("ActivityLogs", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("ActivityLogs", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("ActivitySourceTypes", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("ActivitySourceTypes", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("ActivitySourceTypes", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("AdjustmentInventories", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("AdjustmentInventories", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("AdjustmentInventories", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Areas", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Areas", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Areas", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Brands", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Brands", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Brands", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("CarMakes", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("CarMakes", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("CarMakes", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("CarModels", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("CarModels", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("CarModels", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Cars", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Cars", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Cars", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Categories", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Categories", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Categories", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Cities", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Cities", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Cities", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Companies", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Companies", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Companies", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("CustomerInquiries", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("CustomerInquiries", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("CustomerInquiries", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("DispatchOrders", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("DispatchOrders", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("DispatchOrders", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Drivers", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Drivers", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Drivers", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Files", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Files", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Files", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Inventories", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Inventories", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Inventories", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("InwardGroups", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("InwardGroups", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("InwardGroups", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("OutwardGroups", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("OutwardGroups", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("OutwardGroups", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("PermissionAccesses", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("PermissionAccesses", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("PermissionAccesses", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Permissions", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Permissions", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Permissions", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("ProductInwards", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("ProductInwards", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("ProductInwards", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("ProductOutwards", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("ProductOutwards", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("ProductOutwards", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Products", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Products", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Products", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("RideProducts", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("RideProducts", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("RideProducts", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Rides", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Rides", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Rides", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("UOMs", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("UOMs", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("UOMs", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Users", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Users", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Users", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("VehicleTypes", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("VehicleTypes", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("VehicleTypes", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("VerificationCodes", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("VerificationCodes", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("VerificationCodes", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Warehouses", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Warehouses", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Warehouses", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("WastagesTypes", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("WastagesTypes", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("WastagesTypes", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("Zones", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Zones", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.changeColumn("Zones", "deletedAt", {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("DispatchOrders", "shipmentDate", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
  },
};
