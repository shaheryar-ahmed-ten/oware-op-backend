'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('DispatchOrders', 'dispatchorderIdForBusiness',{
        type: Sequelize.STRING(30),
        allowNull: false,
      })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('DispatchOrders');
  }
};