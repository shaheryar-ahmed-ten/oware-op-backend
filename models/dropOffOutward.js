"use strict";
const { Model } = require("sequelize");
const RIDE_STATUS = require("../enums/rideStatus");
module.exports = (sequelize, DataTypes) => {
  class DropoffOutward extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DropoffOutward.belongsTo(models.RideDropoff, {
        foreignKey: "dropoffId",
      });
    }
  }
  DropoffOutward.init(
    {
      dropoffId: DataTypes.INTEGER,
      outwardId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "DropoffOutward",
    }
  );
  return DropoffOutward;
};
