"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");
const { handleHookError } = require("../utility/utility");

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
        foreignKey: "roleId"
      });
      User.belongsTo(models.Company, {
        as: "Company",
        foreignKey: "companyId"
      });
      User.hasOne(models.Company, {
        foreignKey: "contactId",
        as: "Customer"
      });
      User.hasMany(models.StockAdjustment, {
        foreignKey: "adminId"
      });
    }
    generateHash(password) {
      return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    }
    comparePassword(password) {
      return bcrypt.compareSync(password, this.password);
    }
  }
  User.init(
    {
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Role cannot be empty" } }
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { notEmpty: { msg: "Username cannot be empty" } }
      },
      phone: {
        type: DataTypes.STRING,
        validate: {
          isNumeric: { msg: "Please enter correct phone number" }
        }
      },
      password: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Email cannot be empty" },
          isEmail: { msg: "Email format is incorrect" }
        }
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      paranoid: true,
      modelName: "User"
    }
  );
  User.beforeUpdate((user, options) => {
    if (options.fields.indexOf("password") > -1 && user.password) {
      const hashedPassword = user.generateHash(user.password);
      user.password = hashedPassword;
    }
  });
  User.beforeCreate((user, options) => {
    const hashedPassword = user.generateHash(user.password);
    user.password = hashedPassword;
  });
  User.addHook('afterUpdate', async (data, options) => {
    try {
      const prevUser = data._previousDataValues;
      const newUser = data.dataValues;
      let where = {
        userId: prevUser.id
      }

      let inwardSummaries = await sequelize.models.InwardSummary.findAll({
        where
      })

      // resolve all the db calls at once
      if (inwardSummaries.length) {
        await Promise.all(inwardSummaries.map(summary => {
          summary.creatorName = `${newUser.firstName || ''} ${newUser.lastName || ''}`
          return summary.save()
        }));
      }

      let dispatchOrderSummaries = await sequelize.models.DispatchOrderSummary.findAll({
        where
      })

      if (dispatchOrderSummaries.length) {
        await Promise.all(dispatchOrderSummaries.map(summary => {
          summary.creatorName = `${newUser.firstName || ''} ${newUser.lastName || ''}`
          return summary.save()
        }));
      }
    } catch (error) {
      handleHookError(error, "User")
    }
  })
  return User;
};
