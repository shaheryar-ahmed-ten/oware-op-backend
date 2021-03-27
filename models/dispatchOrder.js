'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class DispatchOrder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      DispatchOrder.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      DispatchOrder.belongsTo(models.ProductInward, {
        foreignKey: 'productInwardId'
      });
      DispatchOrder.hasMany(models.ProductOutward, {
        foreignKey: 'dispatchOrderId'
      });
    };
  };
  DispatchOrder.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    quantity: DataTypes.INTEGER,
    receiverName: DataTypes.STRING,
    receiverPhone: DataTypes.STRING,
    shipmentDate: DataTypes.DATE,
    productInwardId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'DispatchOrder',
  });

  return DispatchOrder;
};