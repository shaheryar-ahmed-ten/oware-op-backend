'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ProductInwards', 'internalIdForBusiness', {
      type: Sequelize.STRING(30),
      allowNull: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('ProductInwards', 'internalIdForBusiness');
  }
};