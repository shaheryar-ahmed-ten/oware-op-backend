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
    return queryInterface.createTable("DispatchOrderSummaries", {
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
      dispatchOrderId: {
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
      receiverName: {
        allowNull: false,
        type: Sequelize.STRING
      },
      receiverPhone: {
        allowNull: false,
        type: Sequelize.STRING
      },
      requestedQuantity: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      referenceId: {
        allowNull: true,
        type: Sequelize.STRING
      },
      creatorName: {
        allowNull: false,
        type: Sequelize.STRING
      },
      shipmentDate: {
        allowNull: false,
        type: Sequelize.DATE
      },
      status: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      orderMemo: {
        allowNull: true,
        type: Sequelize.STRING
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
     return queryInterface.dropTable("DispatchOrderSummaries");

  }
};
