'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('DispatchOrders', 'businessId',{
        type: Sequelize.STRING(30),
        allowNull: false,
      })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('DispatchOrders','buisnessId');
  }
};