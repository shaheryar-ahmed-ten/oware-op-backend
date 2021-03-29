'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class Inventory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Inventory.belongsTo(models.Product, {
        foreignKey: 'productId'
      });
      Inventory.belongsTo(models.Warehouse, {
        foreignKey: 'warehouseId'
      });
      Inventory.belongsTo(models.Customer, {
        foreignKey: 'customerId'
      });
      Inventory.hasMany(models.ProductInward, {
        foreignKey: 'inventoryId'
      });
    };
  };
  Inventory.init({
    quantity: DataTypes.INTEGER,
    commitedQuantity: DataTypes.INTEGER,
    dispatchedQuantity: DataTypes.INTEGER,
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
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'Inventory',
  });

  return Inventory;
};