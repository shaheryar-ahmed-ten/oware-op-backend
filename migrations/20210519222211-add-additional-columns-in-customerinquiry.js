'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('CustomerInquiries', 'monthlyOrders', {
      type: Sequelize.STRING(30),
      allowNull: true,
    })
    await queryInterface.addColumn('CustomerInquiries', 'companyName', {
      type: Sequelize.STRING(120),
      allowNull: true,
    })
    await queryInterface.addColumn('CustomerInquiries', 'industry', {
      type: Sequelize.STRING(30),
      allowNull: true,
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('CustomerInquiries', 'monthlyOrders');
    await queryInterface.removeColumn('CustomerInquiries', 'companyName');
    await queryInterface.removeColumn('CustomerInquiries', 'industry');
  }
};