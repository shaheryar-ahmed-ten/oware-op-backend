'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Users', [{
      firstName: 'Yousha',
      lastName: 'Rizvi',
      email: 'yousha@yopmail.com',
      username: 'yousha',
      isActive: true,
      password: 'yousha',
      phone: '03242363523',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
