"use strict";
const momenttz = require("moment-timezone");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable("InwardGroupBatches", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      inwardGroupId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "InwardGroups", // name of Target model
          key: "id", // key in Target model that we're referencing
        },
      },
      inventoryDetailId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "InventoryDetails", // name of Target model
          key: "id", // key in Target model that we're referencing
        },
      },
      quantity: {
        allowNull: false,
        type: Sequelize.INTEGER,
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
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("InwardGroupBatches");
  },
};
