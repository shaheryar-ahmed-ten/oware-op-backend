"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class InventoryWastage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      InventoryWastage.belongsTo(models.Inventory, {
        foreignKey: "inventoryId"
      });
    }
  }
  InventoryWastage.init(
    {
      inventoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "inventoryId cannot be empty" } }
      },
      type: DataTypes.STRING,
      reason: DataTypes.STRING
    },
    {
      sequelize,
      modelName: "InventoryWastage",
      paranoid: true
    }
  );
  return InventoryWastage;
};
