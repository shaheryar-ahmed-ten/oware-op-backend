'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Role.hasMany(models.PermissionAccess, {
        sourceKey: 'id',
        foreignKey: 'role_id'
      });
    }
  };
  Role.init({
    type: {
      type: DataTypes.STRING,
      unique: true
    },
    name: DataTypes.STRING
  }, {
    sequelize,
    paranoid: true,
    modelName: 'Role',
  });
  return Role;
};