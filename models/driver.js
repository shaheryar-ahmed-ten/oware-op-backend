"use strict";
const { Model } = require("sequelize");
const config = require("../config");
module.exports = (sequelize, DataTypes) => {
  class Driver extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Driver.hasMany(models.Vehicle, {
        foreignKey: "driverId"
      });
      Driver.belongsTo(models.File, {
        foreignKey: "drivingLicenseId",
        as: 'drivingLicense'
      });
      Driver.belongsTo(models.File, {
        foreignKey: "cnicId",
        as: 'cnic'
      });
      Driver.belongsTo(models.File, {
        foreignKey: "photoId",
        as: 'photo'
      });
    }
  }
  Driver.init(
    {
      vendorName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter vendor name" } },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter name" } },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter phone number" } },
      },
      photoId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      cnicId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      drivingLicenseId: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Driver",
      timestamps: true,
    }
  );
  return Driver;
};
