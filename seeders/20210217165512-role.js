'use strict';

const { query } = require("express");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Roles', [{
      name: 'Admin',
      type: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      name: 'Admin',
      type: 'superAdmin',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Roles', null, {});
  }
};
