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
      DispatchOrder.belongsTo(models.Product, {
        foreignKey: 'productId'
      });
      DispatchOrder.belongsTo(models.Warehouse, {
        foreignKey: 'warehouseId'
      });
      DispatchOrder.belongsTo(models.Customer, {
        foreignKey: 'customerId'
      });
      DispatchOrder.hasMany(models.ProductOutward, {
        foreignKey: 'dispatchOrderId'
      });
    };
  };
  DispatchOrder.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: DataTypes.INTEGER,
    receiverName: DataTypes.STRING,
    receiverPhone: DataTypes.STRING,
    shipmentDate: DataTypes.DATE,
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    warehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'DispatchOrder',
  });

  return DispatchOrder;
};