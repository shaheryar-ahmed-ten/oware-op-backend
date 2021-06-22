"use strict";
const { Model } = require("sequelize");
const config = require("../config");
module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      File.hasMany(models.Vehicle, {
        foreignKey: "fileId"
      })
      File.hasOne(models.Driver, {
        foreignKey: "drivingLicenseId",
        as: 'drivingLicense'
      })
      File.hasOne(models.Driver, {
        foreignKey: "cnicId",
        as: 'cnic'
      })
      File.hasOne(models.Driver, {
        foreignKey: "photoId",
        as: 'photo'
      })
    }
  }
  File.init({
    bucket: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Please enter a file" } },
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Please enter a file" } },
    },
    originalName: {
      type: DataTypes.STRING,
    },
    encoding: {
      type: DataTypes.STRING,
    },
    mimeType: {
      type: DataTypes.STRING,
    },
    size: {
      type: DataTypes.STRING,
    }
  },
    {
      sequelize,
      paranoid: true,
      modelName: "File",
      timestamps: true,
    }
  );
  return File;
};
