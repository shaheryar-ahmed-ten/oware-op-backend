'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class OutwardGroup extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      OutwardGroup.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      OutwardGroup.belongsTo(models.Product, {
        foreignKey: 'productId'
      });
      OutwardGroup.belongsTo(models.ProductOutward, {
        foreignKey: 'outwardId'
      });
    };
  };
  OutwardGroup.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true }
    },
    quantity: {
      type: DataTypes.INTEGER,
      validate: {
        isInt: { msg: 'Please enter quantity' }
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: { msg: 'Product cannot be empty' } }
    },
    outwardId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: { msg: 'Outward cannot be empty' } }
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'OutwardGroup',
  });

  return OutwardGroup;
};