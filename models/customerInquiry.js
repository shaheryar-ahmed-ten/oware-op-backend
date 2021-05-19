'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');
const config = require('../config');

module.exports = (sequelize, DataTypes) => {
  class CustomerInquiry extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    };
  };
  CustomerInquiry.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Please enter name' } }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Please enter phone number' } }
    },
    serviceType: DataTypes.STRING,
    cityForService: DataTypes.STRING,
    monthlyOrders: DataTypes.STRING,
    companyName: DataTypes.STRING,
    industry: DataTypes.STRING
  }, {
    sequelize,
    paranoid: true,
    modelName: 'CustomerInquiry',
  });

  return CustomerInquiry;
};
