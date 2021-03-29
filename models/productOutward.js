'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class ProductOutward extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProductOutward.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      ProductOutward.belongsTo(models.DispatchOrder, {
        foreignKey: 'dispatchOrderId'
      });
    };
  };
  ProductOutward.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: DataTypes.INTEGER,
    dispatchOrderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'ProductOutward',
  });

  return ProductOutward;
};