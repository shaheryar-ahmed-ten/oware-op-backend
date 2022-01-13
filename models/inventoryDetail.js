"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class InventoryDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      InventoryDetail.belongsTo(models.Inventory, {
        foreignKey: "inventoryId",
        as: "Inventory",
      });
      InventoryDetail.belongsToMany(models.InwardGroup, {
        through: models.InwardGroupBatch,
        as: "InwardGroup",
        foreignKey: "inventoryDetailId",
      });
      InventoryDetail.belongsToMany(models.OutwardGroup, {
        through: models.OutwardGroupBatch,
        as: "OutwardGroup",
        foreignKey: "inventoryDetailId",
      });
    }
  }
  InventoryDetail.init(
    {
      InventoryId: DataTypes.INTEGER,
      batchName: DataTypes.INTEGER,
      manufacturingDate: DataTypes.DATE,
      expiryDate: DataTypes.DATE,
      batchNumber: DataTypes.STRING,
      inwardQuantity: DataTypes.INTEGER,
      availableQuantity: DataTypes.INTEGER,
      outwardQuantity: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "InventoryDetail",
    }
  );
  return InventoryDetail;
};
