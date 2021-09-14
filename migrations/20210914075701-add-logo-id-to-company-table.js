'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Companies', 'logoId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Files', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Companies', 'logoId');
  }
};
