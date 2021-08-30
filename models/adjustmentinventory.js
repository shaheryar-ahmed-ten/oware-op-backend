"use strict";
const { Model } = require("sequelize");
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
        foreignKey: "adjustmentId"
      });
    }
  }
  AdjustmentInventory.init(
    {
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
