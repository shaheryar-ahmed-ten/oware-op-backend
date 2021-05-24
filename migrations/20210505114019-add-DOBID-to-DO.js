'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('DispatchOrders', 'internalIdForBusiness', {
      type: Sequelize.STRING(30),
      allowNull: false
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('DispatchOrders', 'businessId');
  }
};