'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PermissionAccess extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      PermissionAccess.hasOne(models.Permission, {
        sourceKey: 'role_id',
        foreignKey: 'id'
      });
    }
  };
  PermissionAccess.init({
    role_id: DataTypes.INTEGER,
    permission_id: DataTypes.INTEGER
  }, {
    sequelize,
    paranoid: true,
    modelName: 'PermissionAccess',
  });
  return PermissionAccess;
};