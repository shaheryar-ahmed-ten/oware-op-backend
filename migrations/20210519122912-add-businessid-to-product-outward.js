'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ProductOutwards', 'internalIdForBusiness', {
      type: Sequelize.STRING(30),
      allowNull: false
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('ProductOutwards', 'businessId');
  }
};