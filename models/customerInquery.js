'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');
const config = require('../config');

module.exports = (sequelize, DataTypes) => {
  class CustomerInquery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    };
  };
  CustomerInquery.init({
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
    email:DataTypes.STRING,
    pickUp: DataTypes.STRING,
    dropOff: DataTypes.STRING,
    notes: DataTypes.STRING,
    goodsType: DataTypes.STRING,
  }, {
    sequelize,
    paranoid: true,
    modelName: 'CustomerInquery',
  });

  return CustomerInquery;
};