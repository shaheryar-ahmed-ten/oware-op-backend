'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('DispatchOrders', 'referenceId',{
        type: Sequelize.STRING(30),
        allowNull: true,
      })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('DispatchOrders');
  }
};