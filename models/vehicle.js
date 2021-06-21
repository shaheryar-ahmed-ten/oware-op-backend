"use strict";
const { Model } = require("sequelize");
const config = require("../config");
module.exports = (sequelize, DataTypes) => {
  class Vehicle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Vehicle.hasOne(models.ProductOutward, {
        foreignKey: "vehicleId",
      });
      Vehicle.belongsTo(models.Driver, {
        foreignKey: "driverId"
      }),
      Vehicle.belongsTo(models.File, {
          foreignKey: "fileId"
      })
    }
  }
  Vehicle.init(
    {
      driverId: {
        type: DataTypes.INTEGER,
      },
      fileId: {
        type: DataTypes.INTEGER,
      },
      number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter a vehicle number" } },
      },
      type: {
        type: DataTypes.ENUM({
          values: config.vehicleTypes,
        }),
        allowNull: false,
        validate: { notEmpty: { msg: "Please select vehicle type" } },
      },
      vendorName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter vendor name" } },
      },
      vendorNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter vendor number" } },
      },
      make: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter make" } },
      },
      modelYear: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter model year" } },
      },
      photoId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      runningPaperId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: 'Please add a file' } }
      },
      routePermitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: 'Please add a file' } }
      }
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Vehicle",
      timestamps: true,
    }
  );
  return Vehicle;
};
