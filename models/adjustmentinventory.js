"use strict";
const { Model, sequelize } = require("sequelize");
const { WastagesType } = require("./index");
module.exports = (sequelize, DataTypes) => {
  class AdjustmentInventory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      AdjustmentInventory.belongsTo(models.Inventory, {
        foreignKey: "inventoryId"
      });
      AdjustmentInventory.belongsTo(models.StockAdjustment, {
        foreignKey: "adjustmentId",
        as: "StockAdjustment"
      });
      AdjustmentInventory.belongsTo(models.WastagesType, {
        foreignKey: "reason",
        as: "WastagesType"
      });
    }
  }
  AdjustmentInventory.init(
    {
      reason: {
        type: DataTypes.INTEGER
      },
      comment: DataTypes.STRING,
      adjustmentQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "adjustmentQuantity cannot be empty" } }
      },
      adjustmentId: DataTypes.INTEGER,
      inventoryId: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: "AdjustmentInventory",
      paranoid: true
    }
  );
  return AdjustmentInventory;
};
