'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    // logic for transforming into the new state
    await queryInterface.addColumn('UOMs', 'isActive', Sequelize.BOOLEAN);
    await queryInterface.addColumn('Categories', 'isActive', Sequelize.BOOLEAN);
    await queryInterface.addColumn('Brands', 'isActive', Sequelize.BOOLEAN);
    await queryInterface.addColumn('Products', 'isActive', Sequelize.BOOLEAN);
  },

  down: async function (queryInterface, Sequelize) {
    // logic for reverting the changes
    await queryInterface.removeColumn('UOMs', 'isActive');
    await queryInterface.removeColumn('Categories', 'isActive');
    await queryInterface.removeColumn('Brands', 'isActive');
    await queryInterface.removeColumn('Products', 'isActive');
  }
}
