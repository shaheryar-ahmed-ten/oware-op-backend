'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.belongsTo(models.Role, {
        foreignKey: 'roleId'
      });
    };
    generateHash(password) {
      return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };
    comparePassword(password) {
      return bcrypt.compareSync(password, this.password);
    };
  };
  User.init({
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    phone: DataTypes.STRING,
    password: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'User',
  });
  User.beforeCreate((user, options) => {
    const hashedPassword = user.generateHash(user.password);
    user.password = hashedPassword;
  });

  return User;
};