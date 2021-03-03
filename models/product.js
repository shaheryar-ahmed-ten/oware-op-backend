'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      Product.belongsTo(models.Brand, {
        foreignKey: 'brandId'
      });
      Product.belongsTo(models.UOM, {
        foreignKey: 'uomId'
      });
      Product.belongsTo(models.Category, {
        foreignKey: 'categoryId'
      });
    };
  };
  Product.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    dimensionsCBM: DataTypes.STRING,
    weight: DataTypes.STRING,
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    brandId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    uomId: {
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
    modelName: 'Product',
  });

  return Product;
};