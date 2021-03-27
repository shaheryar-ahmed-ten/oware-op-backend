'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    // logic for transforming into the new state
    await queryInterface.addColumn('ProductInwards', 'currentQuantity', Sequelize.INTEGER);
  },

  down: async function (queryInterface, Sequelize) {
    // logic for reverting the changes
    await queryInterface.removeColumn('ProductInwards', 'currentQuantity');
  }
}
