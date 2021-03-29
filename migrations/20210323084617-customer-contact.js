'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    // logic for transforming into the new state
    await queryInterface.addColumn('Customers', 'contactId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    await queryInterface.removeColumn('Customers', 'contactName');
    await queryInterface.removeColumn('Customers', 'contactEmail');
    await queryInterface.removeColumn('Customers', 'contactPhone');
  },
  
  down: async function (queryInterface, Sequelize) {
    // logic for reverting the changes
    await queryInterface.removeColumn('Customers', 'contactId');
    await queryInterface.addColumn('Customers', 'contactName', Sequelize.STRING);
    await queryInterface.addColumn('Customers', 'contactEmail', Sequelize.STRING);
    await queryInterface.addColumn('Customers', 'contactPhone', Sequelize.STRING);
  }
}
