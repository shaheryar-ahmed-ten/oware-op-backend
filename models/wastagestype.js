"use strict";
const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class WastagesType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      WastagesType.hasMany(models.AdjustmentInventory, {
        foreignKey: "reason"
      });
    }
  }
  WastagesType.init(
    {
      name: { type: DataTypes.STRING, allowNull: false, unique: true }
    },
    {
      sequelize,
      modelName: "WastagesType"
    }
  );
  return WastagesType;
};
