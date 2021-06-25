"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Car extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      
      Car.belongsTo(models.CarModel, {
        foreignKey: "modelId"
      })
      Car.belongsTo(models.CarMake, {
        foreignKey: "makeId"
      })
      Car.hasMany(models.Vehicle, {
        foreignKey: "carId"
      })
      // Car.belongsTo(models.VehicleType, {
      //   foreignKey: "vehicleTypeId"
      // })
    }
  }
  Car.init(
    {
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
      vehicleTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter vehicle type name" } },
      }
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Car",
      timestamps: true,
    }
  );
  return Car;
};
