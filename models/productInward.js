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
    };
  };
  ProductInward.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notNull: true }
    },
    quantity: {
      type: DataTypes.INTEGER,
      validate: {
        isInt: true
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notNull: true }
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notNull: true }
    },
    warehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notNull: true }
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'ProductInward',
  });

  return ProductInward;
};