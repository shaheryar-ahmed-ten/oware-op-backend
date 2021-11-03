'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Rides', 'eta', {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  );
  await queryInterface.changeColumn('Rides', 'completionTime', {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Rides', 'eta', {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  );
  await queryInterface.changeColumn('Rides', 'completionTime', {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  );
  }
};
