"use strict";
const { Model } = require("sequelize");
const config = require("../config");
module.exports = (sequelize, DataTypes) => {
  class CarModel extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CarModel.hasOne(models.Vehicle, {
        foreignKey: "modelId",
      });
    }
  }
  CarModel.init(
    {
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter a Model name" } },
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "CarModel",
      timestamps: true,
    }
  );
  return CarModel;
};
