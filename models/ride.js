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
      Ride.belongsTo(models.User, {
        foreignKey: "userId",
      });
      Ride.belongsTo(models.Vehicle, {
        foreignKey: "vehicleId",
      });
      Ride.belongsTo(models.Driver, {
        foreignKey: "vehicleId",
      });
      Ride.belongsTo(models.Area, {
        foreignKey: "pickupAreaId",
        as: 'PickupArea'
      });
      Ride.belongsTo(models.Area, {
        foreignKey: "dropoffAreaId",
        as: 'DropoffArea'
      });
      Ride.belongsTo(models.Company, {
        foreignKey: "customerId",
        as: 'Customer'
      });
      Ride.hasMany(models.RideProduct, {
        foreignKey: "rideId"
      });
    }
  }
  Ride.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true }
    },
    customerId: DataTypes.INTEGER,
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
    pickupAddress: DataTypes.STRING,
    pickupAreaId: DataTypes.INTEGER,
    dropoffAddress: DataTypes.STRING,
    dropoffAreaId: DataTypes.INTEGER,
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
