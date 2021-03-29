'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Customer.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      Customer.belongsTo(models.User, {
        foreignKey: 'contactId',
        as: 'Contact'
      });
    };
  };
  Customer.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    contactId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    companyName: DataTypes.STRING,
    notes: DataTypes.STRING,
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'Customer',
  });

  return Customer;
};