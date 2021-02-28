'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Permissions', [{
      type: 'admin_privileges',
      name: 'Admin Privileges',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      type: 'superadmin_privileges',
      name: 'Super Admin Privileges',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Permissions', null, {});
  }
};
