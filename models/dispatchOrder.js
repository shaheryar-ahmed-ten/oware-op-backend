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
      DispatchOrder.hasMany(models.ProductOutward, {
        foreignKey: 'dispatchOrderId'
      });
      DispatchOrder.belongsTo(models.Inventory, {
        foreignKey: 'inventoryId'
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
    inventoryId: {
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