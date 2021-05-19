'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ProductOutwards', 'businessId',{
        type: Sequelize.STRING(30),
        allowNull: true,
      })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ProductOutwards','businessId');
  }
};