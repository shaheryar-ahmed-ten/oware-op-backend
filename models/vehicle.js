"use strict";
const { Model } = require("sequelize");
const { VEHICLE_TYPES } = require("../enums");
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
          foreignKey: "runningPaperId",
          as: 'runningPaper'
        });
      Vehicle.belongsTo(models.File, {
        foreignKey: "routePermitId",
        as: 'routePermit'
      });
      Vehicle.belongsTo(models.File, {
        foreignKey: "photoId",
        as: 'Photo'
      });
      Vehicle.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: 'Vendor'
      });
      Vehicle.belongsTo(models.CarModel, {
        foreignKey: "modelId"
      })
      Vehicle.belongsTo(models.CarMake, {
        foreignKey: "makeId"
      })
    }
  }
  Vehicle.init(
    {
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter vendor name" } },
      },
      driverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter driver name" } },
      },
      type: {
        type: DataTypes.ENUM({
          values: Object.keys(VEHICLE_TYPES),
        }),
        allowNull: false,
        validate: { notEmpty: { msg: "Please select vehicle type" } },
      },
      registrationNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter a vehicle number" } },
      },
      makeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter make name" } },
      },
      modelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter model name" } },
      },
      year: {
        type: DataTypes.STRING,
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
