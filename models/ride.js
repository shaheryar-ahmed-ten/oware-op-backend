"use strict";
const { Model } = require("sequelize");
const config = require("../config");
const { RIDE_STATUS } = require("../enums");
const { sendWhatsappAlert } = require("../services/common.services");
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
        foreignKey: "driverId",
      });
      // Ride.belongsTo(models.Area, {
      //   foreignKey: "pickupAreaId",
      //   as: "PickupArea",
      // });
      // Ride.belongsTo(models.Area, {
      //   foreignKey: "dropoffAreaId",
      //   as: "DropoffArea",
      // });
      Ride.belongsTo(models.Company, {
        foreignKey: "customerId",
        as: "Customer",
      });
      Ride.hasMany(models.RideProduct, {
        foreignKey: "rideId",
        sourceKey: "id",
      });
      Ride.belongsTo(models.File, {
        foreignKey: "manifestId",
        as: "Manifest",
      });
      Ride.belongsTo(models.City, {
        foreignKey: "pickupCityId",
        as: "pickupCity",
      });
      Ride.belongsTo(models.City, {
        foreignKey: "dropoffCityId",
        as: "dropoffCity",
      });
    }
  }
  Ride.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      driverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      manifestId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      internalIdForBusiness: DataTypes.STRING,
      pickupDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: { notEmpty: { msg: "Please select pickup date" } },
      },
      dropoffDate: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: { notEmpty: { msg: "Please select dropoff date" } },
      },
      pickupAddress: DataTypes.STRING,
      // pickupAreaId: {
      //   type: DataTypes.INTEGER,
      //   allowNull: true,
      // },
      dropoffAddress: DataTypes.STRING,
      // dropoffAreaId: {
      //   type: DataTypes.INTEGER,
      //   allowNull: true,
      // },
      pickupCityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      dropoffCityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      memo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cancellationReason: DataTypes.STRING,
      cancellationComment: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM({
          values: Object.keys(RIDE_STATUS),
        }),
        allowNull: false,
        defaultValue: RIDE_STATUS.UNASSIGNED,
      },
      weightCargo: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      pocName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pocNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      eta: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      completionTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      currentLocation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      eirId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      builtyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cost: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customerDiscount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      driverIncentive: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pickupLocation: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      dropoffLocation: {
        type: DataTypes.JSON,
        allowNull: true,
      },
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
