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
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Companies', 'logoId');
  }
};
