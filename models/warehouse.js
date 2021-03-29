'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class Warehouse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Warehouse.belongsTo(models.User, {
        foreignKey: 'userId'
      });
    };
  };
  Warehouse.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: DataTypes.STRING,
    businessWarehouseCode: DataTypes.STRING,
    address: DataTypes.STRING,
    city: DataTypes.STRING, 
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'Warehouse',
  });

  return Warehouse;
};