'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class ProductInward extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProductInward.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      ProductInward.belongsTo(models.Product, {
        foreignKey: 'productId'
      });
      ProductInward.belongsTo(models.Warehouse, {
        foreignKey: 'warehouseId'
      });
      ProductInward.belongsTo(models.Customer, {
        foreignKey: 'customerId'
      });
      ProductInward.belongsTo(models.Inventory, {
        foreignKey: 'inventoryId'
      });
    };
  };
  ProductInward.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: DataTypes.INTEGER,
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    inventoryId: {
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
    modelName: 'ProductInward',
  });

  return ProductInward;
};