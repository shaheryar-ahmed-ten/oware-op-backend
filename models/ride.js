"use strict";
const { Model } = require("sequelize");
const config = require("../config");
const { RIDE_STATUS } = require("../enums");
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
      Ride.belongsTo(models.Driver, {
        foreignKey: "vehicleId",
      });
    }
  }
  Ride.init({
    vehicleId: DataTypes.INTEGER,
    driverId: DataTypes.INTEGER,
    pickupDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: { notEmpty: { msg: 'Please select pickup date' } }
    },
    dropoffDate: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: { notEmpty: { msg: 'Please select dropoff date' } }
    },
    pickupArea: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Please enter pickup area' } }
    },
    dropoffArea: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Please enter dropoff area' } }
    },
    status: {
      type: DataTypes.ENUM({
        values: Object.keys(RIDE_STATUS)
      }),
      allowNull: false,
      defaultValue: RIDE_STATUS.UNASSIGNED
    }
  }, {
    sequelize,
    paranoid: true,
    modelName: "Ride",
    timestamps: true,
  });
  return Ride;
};
