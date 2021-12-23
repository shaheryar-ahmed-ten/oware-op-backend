"use strict";
const { Model } = require("sequelize");
const RIDE_STATUS = require("../enums/rideStatus");
module.exports = (sequelize, DataTypes) => {
  class DropoffProduct extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      DropoffProduct.belongsTo(models.RideDropoff, {
        foreignKey: "dropoffId",
      });
    }
  }
  DropoffProduct.init(
    {
      dropoffId: DataTypes.INTEGER,
      categoryId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      quantity: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "DropoffProduct",
    }
  );
  return DropoffProduct;
};
