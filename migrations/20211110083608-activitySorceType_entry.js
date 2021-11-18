"use strict";

const Dao = require("../dao");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    let data;
    const types = await Dao.ActivitySourceType.findAll({ where: {} });
    data = types.find((type) => type.name == "StockAdjustment");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "StockAdjustment",
        hasInternalIdForBusiness: 1,
      });
    data = types.find((type) => type.name == "Brand");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "Brand",
        hasInternalIdForBusiness: 0,
      });
    data = types.find((type) => type.name == "Company");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "Company",
        hasInternalIdForBusiness: 1,
      });
    data = types.find((type) => type.name == "Category");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "Category",
        hasInternalIdForBusiness: 0,
      });
    data = types.find((type) => type.name == "UOM");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "UOM",
        hasInternalIdForBusiness: 0,
      });
    data = types.find((type) => type.name == "Warehouse");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "Warehouse",
        hasInternalIdForBusiness: 0,
      });
    data = types.find((type) => type.name == "Product");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "Product",
        hasInternalIdForBusiness: 0,
      });
    data = types.find((type) => type.name == "ProductInward");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "ProductInward",
        hasInternalIdForBusiness: 1,
      });
    data = types.find((type) => type.name == "DispatchOrder");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "DispatchOrder",
        hasInternalIdForBusiness: 1,
      });
    data = types.find((type) => type.name == "Inventory");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "Inventory",
        hasInternalIdForBusiness: 0,
      });
    data = types.find((type) => type.name == "Driver");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "Driver",
        hasInternalIdForBusiness: 0,
      });
    data = types.find((type) => type.name == "Vehicle");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "Vehicle",
        hasInternalIdForBusiness: 0,
      });
    data = types.find((type) => type.name == "Ride");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "Ride",
        hasInternalIdForBusiness: 1,
      });
    data = types.find((type) => type.name == "User");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "User",
        hasInternalIdForBusiness: 0,
      });
    data = types.find((type) => type.name == "ProductOutward");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "ProductOutward",
        hasInternalIdForBusiness: 1,
      });
    data = types.find((type) => type.name == "Car");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "Car",
        hasInternalIdForBusiness: 0,
      });
    data = types.find((type) => type.name == "Vendor");
    if (!data)
      await Dao.ActivitySourceType.create({
        name: "Vendor",
        hasInternalIdForBusiness: 1,
      });
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
