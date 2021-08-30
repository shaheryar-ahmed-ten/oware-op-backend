"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class StockAdjustment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      StockAdjustment.belongsTo(models.User, {
        foreignKey: "adminId",
        as: "Admin"
      });
      StockAdjustment.belongsTo(models.WastagesType, {
        foreignKey: "type",
        as: "WastagesType"
      });
      StockAdjustment.belongsToMany(models.Inventory, {
        foreignKey: "adjustmentId",
        through: models.AdjustmentInventory,
        as: "Inventories"
      });
    }
  }
  StockAdjustment.init(
    {
      inventoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "inventoryId cannot be empty" } }
      },
      type: DataTypes.STRING,
      reason: DataTypes.STRING,
      adjustmentQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "adjustmentQuantity cannot be empty" } }
      },
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Admin cannot be empty" } }
      }
    },
    {
      sequelize,
      modelName: "StockAdjustment",
      paranoid: true
    }
  );
  return StockAdjustment;
};
