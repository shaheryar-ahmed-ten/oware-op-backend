"use strict";
const momenttz = require("moment-timezone");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        "RideDropoffs",
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          type: {
            allowNull: false,
            type: Sequelize.ENUM("OUTWARD", "PRODUCT"),
          },
          outwardId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: "ProductOutwards",
              key: "id",
            },
          },
          rideId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: "Rides",
              key: "id",
            },
          },
          status: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          cityId: {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: {
              model: "Cities", // name of Target model
              key: "id", // key in Target model that we're referencing
            },
          },
          address: {
            allowNull: true,
            type: Sequelize.STRING,
          },
          location: {
            allowNull: true,
            type: Sequelize.JSON,
          },
          dateTime: {
            allowNull: true,
            type: Sequelize.DATE,
          },
          pocName: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          pocNumber: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          currentLocation: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          memo: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          manifestId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: "Files",
              key: "id",
            },
          },
          cancellationReason: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          cancellationComment: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
          },
          deletedAt: {
            allowNull: true,
            type: Sequelize.DATE,
          },
        },
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("RideDropoffs");
  },
};
