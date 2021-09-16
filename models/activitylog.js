"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ActivityLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ActivityLog.belongsTo(models.User, {
        foreignKey: "userId",
        as: "User",
      });
      ActivityLog.belongsTo(models.ActivitySourceType, {
        foreignKey: "sourceType",
        as: "ActivitySourceType",
      });
    }
  }
  ActivityLog.init(
    {
      userId: DataTypes.INTEGER,
      currentPayload: DataTypes.JSON,
      previousPayload: DataTypes.JSON,
      sourceId: DataTypes.INTEGER,
      sourceType: DataTypes.INTEGER,
      activityType: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "ActivityLog",
    }
  );
  return ActivityLog;
};
