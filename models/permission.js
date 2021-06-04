'use strict';
const { Model } = require('sequelize');
const { apps } = require('../config');

module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Permission.init({
    type: {
      type: DataTypes.STRING,
      unique: true
    },
    name: DataTypes.STRING,
    allowedApps: {
      type: DataTypes.ENUM({
        values: apps
      }),
      allowNull: false,
      defaultValue: apps[0]
    }
  }, {
    sequelize,
    paranoid: true,
    modelName: 'Permission',
  });
  return Permission;
};