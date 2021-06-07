'use strict';
const { APPS } = require('../enums');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('Customers', 'Companies');
    await queryInterface.renameColumn('Companies', 'companyName', 'name');
    await queryInterface.addColumn('Companies', 'allowedApps', {
      type: Sequelize.STRING,
      defaultValue: Object.keys(APPS)[0]
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('Companies', 'name', 'companyName');
    await queryInterface.dropTable('Companies', 'Customers');
  }
};