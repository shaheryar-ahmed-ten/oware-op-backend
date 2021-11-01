'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Rides', 'eta', {
      type: Sequelize.TIME,
      allowNull: true,
    },
  );
  await queryInterface.changeColumn('Rides', 'completionTime', {
      type: Sequelize.TIME,
      allowNull: true,
    },
  );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Rides", "eta");
    await queryInterface.removeColumn("Rides", "completionTime");
  }
};
