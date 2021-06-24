"use strict";
const { Model } = require("sequelize");
const config = require("../config");
module.exports = (sequelize, DataTypes) => {
  class CarMake extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CarMake.hasMany(models.Car, {
        foreignKey: "makeId",
      });
    }
  }
  CarMake.init(
    {
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter a make name" } },
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "CarMake",
      timestamps: true,
    }
  );
  return CarMake;
};
