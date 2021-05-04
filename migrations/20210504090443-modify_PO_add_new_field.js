'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ProductOutwards', 'referenceId',{
        type: Sequelize.STRING(30),
        allowNull: true,
      })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ProductOutwards');
  }
};