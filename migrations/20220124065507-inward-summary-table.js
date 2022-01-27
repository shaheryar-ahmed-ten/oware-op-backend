'use strict';
const momenttz = require("moment-timezone");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable("InwardSummaries", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      inwardId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      customerName: {
        allowNull: false,
        type: Sequelize.STRING
      },
      productName: {
        allowNull: false,
        type: Sequelize.STRING
      },
      warehouseName: {
        allowNull: false,
        type: Sequelize.STRING
      },
      uom: {
        allowNull: false,
        type: Sequelize.STRING
      },
      inwardQuantity: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      vehicleType: {
        allowNull: true,
        type: Sequelize.STRING
      },
      vehicleName: {
        allowNull: true,
        type: Sequelize.STRING
      },
      vehicleNumber: {
        allowNull: true,
        type: Sequelize.STRING
      },
      driverName: {
        allowNull: true,
        type: Sequelize.STRING
      },
      memo: {
        allowNull: true,
        type: Sequelize.STRING
      },
      referenceId: {
        allowNull: true,
        type: Sequelize.STRING
      },
      creatorName: {
        allowNull: false,
        type: Sequelize.STRING
      },
      inwardDate: {
        allowNull: false,
        type: Sequelize.DATE
      },
      batchQuantity: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      batchNumber: {
        allowNull: true,
        type: Sequelize.STRING
      },
      manufacturingDate: {
        allowNull: true,
        type: Sequelize.DATE
      },
      expiryDate: {
        allowNull: true,
        type: Sequelize.DATE
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
    await queryInterface.dropTable("InwardSummaries");

  }
};
