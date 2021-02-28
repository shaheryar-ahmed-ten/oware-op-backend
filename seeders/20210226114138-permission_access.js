'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('PermissionAccesses', [{
      role_id: 1,
      permission_id: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      role_id: 2,
      permission_id: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('PermissionAccesses', null, {});
  }
};
