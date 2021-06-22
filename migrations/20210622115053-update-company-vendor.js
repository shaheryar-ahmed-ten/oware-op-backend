'use strict';
const { RELATION_TYPES } = require('../enums');


module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Companies', 'relationType', {
      type: Sequelize.STRING,
      defaultValue: RELATION_TYPES.CUSTOMER
    });
    await queryInterface.addColumn('Companies', 'phone', {
      type: Sequelize.STRING
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Companies', 'relationType');
    await queryInterface.removeColumn('Companies', 'phone');
  }
};
