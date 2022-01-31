'use strict';
const {
  Model
} = require('sequelize');
const { handleHookError } = require('../utility/utility');
module.exports = (sequelize, DataTypes) => {
  class UOM extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UOM.belongsTo(models.User, {
        foreignKey: 'userId'
      });
    }
  };
  UOM.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true }
    },
    name: {
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
    modelName: 'UOM',
  });
  UOM.addHook('afterUpdate', async (data, options) => {
    try {
      const prevUom = data._previousDataValues;
      const newUom = data.dataValues;
      let where = {
        uom: prevUom.name
      }

      let inwardSummaries = await sequelize.models.InwardSummary.findAll({
        where
      })

      // resolve all the db calls at once
      if (inwardSummaries.length) {
        await Promise.all(inwardSummaries.map(summary => {
          summary.uom = newUom.name
          return summary.save()
        }));
      }

      let dispatchOrderSummaries = await sequelize.models.DispatchOrderSummary.findAll({
        where
      })

      if (dispatchOrderSummaries.length) {
        await Promise.all(dispatchOrderSummaries.map(summary => {
          summary.uom = newUom.name
          return summary.save()
        }));
      }

    } catch (error) {
      handleHookError(error, "UOM")
    }
  })
  return UOM;
};