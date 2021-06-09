'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Products', 'weight', {
      type: Sequelize.FLOAT,
      defaultValue: 0
    });
    await queryInterface.changeColumn('Products', 'dimensionsCBM', {
      type: Sequelize.FLOAT,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Products', 'weight', {
      type: Sequelize.STRING
    });
    await queryInterface.changeColumn('Products', 'dimensionsCBM', {
      type: Sequelize.STRING
    });
  }
};
