"use strict";
const { Model } = require("sequelize");
const { digitize } = require("../services/common.services");
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
        as: "Admin",
      });
      StockAdjustment.belongsToMany(models.Inventory, {
        foreignKey: "adjustmentId",
        through: models.AdjustmentInventory,
        as: "Inventories",
      });
      StockAdjustment.hasMany(models.AdjustmentInventory, {
        foreignKey: "adjustmentId",
        as: "AdjustmentInventory",
      });
    }
  }
  StockAdjustment.init(
    {
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Admin cannot be empty" } },
      },
      internalIdForBusiness: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Admin cannot be empty" } },
      },
    },
    {
      sequelize,
      modelName: "StockAdjustment",
      paranoid: true,
    }
  );

  // StockAdjustment.afterCreate(async (stockadjustment, options) => {
  //   const numberOfInternalIdForBusiness = digitize(stockadjustment.id, 6);
  //   stockadjustment.internalIdForBusiness = stockadjustment.internalIdForBusiness + numberOfInternalIdForBusiness;
  //   const adjustment = await stockadjustment.sequelize.models.ActivityLog.create({
  //     userId: 12,
  //     currentPayload: stockadjustment,
  //     previousPayload: null,
  //     sourceId: stockadjustment.id,
  //     sourceType: 1,
  //   });
  //   console.log("adjustment", adjustment);
  // });
  return StockAdjustment;
};
