"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class WastagesType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
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
