"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class Inventory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Inventory.belongsTo(models.Product, {
        foreignKey: "productId",
      });
      Inventory.belongsTo(models.Warehouse, {
        foreignKey: "warehouseId",
      });
      Inventory.belongsTo(models.Company, {
        foreignKey: "customerId",
      });
      Inventory.hasMany(models.DispatchOrder, {
        foreignKey: "inventoryId",
      });
      Inventory.belongsToMany(models.DispatchOrder, {
        through: models.OrderGroup,
        foreignKey: "inventoryId",
      });
      Inventory.belongsToMany(models.ProductOutward, {
        through: models.OutwardGroup,
        foreignKey: "inventoryId",
      });
      Inventory.belongsToMany(models.StockAdjustment, {
        foreignKey: "inventoryId",
        through: models.AdjustmentInventory,
        as: "StockAdjustment",
      });
      Inventory.belongsToMany(models.WastagesType, {
        foreignKey: "inventoryId",
        through: "AdjustmentInventory",
        as: "WastagesType",
      });
      Inventory.hasOne(models.AdjustmentInventory, {
        foreignKey: "inventoryId",
        as: "AdjustmentDetails",
      });
      Inventory.hasMany(models.InventoryDetail, {
        foreignKey: "inventoryId",
        as: "InventoryDetail",
      });
    }
  }
  Inventory.init(
    {
      availableQuantity: DataTypes.INTEGER,
      totalInwardQuantity: DataTypes.INTEGER,
      committedQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      dispatchedQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Product cannot be empty" } },
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Customer cannot be empty" } },
      },
      warehouseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Warehouse cannot be empty" } },
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Inventory",
    }
  );

  return Inventory;
};
