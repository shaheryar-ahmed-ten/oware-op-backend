"use strict";
const { Model } = require("sequelize");
const config = require("../config");
module.exports = (sequelize, DataTypes) => {
  class Ride extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Ride.belongsTo(models.Vehicle, {
        foreignKey: "vehicleId",
      });
    }
  }
  Ride.init(
    {
      number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        //validate: { notEmpty: { msg: "Please enter a vehicle number" } },
      },
      vehicleId: DataTypes.INTEGER,
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Ride",
      timestamps: true,
    }
  );
  return Ride;
};
