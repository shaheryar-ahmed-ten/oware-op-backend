'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Roles', 'isSystemDefined', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.addColumn('Roles', 'isUserDefined', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Roles', 'isSystemDefined');
    await queryInterface.removeColumn('Roles', 'isUserDefined');
  }
};