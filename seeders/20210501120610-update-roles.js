'use strict';
const { Role } = require('../models')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Role.update({
      name: 'Super Admin'
    }, {
      where: {
        type: 'SUPER_ADMIN'
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await Role.update({
      name: 'Admin'
    }, {
      type: 'SUPER_ADMIN'
    });
  }
};
