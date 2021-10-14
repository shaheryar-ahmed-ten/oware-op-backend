'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    await queryInterface.changeColumn('Companies', 'notes', {
      type: Sequelize.TEXT,
    });

    await queryInterface.changeColumn('Rides', 'memo', {
      type: Sequelize.TEXT,
      allowNull: true
    });

  },

  down: async (queryInterface, Sequelize) => {
   

    await queryInterface.removeColumn('Comapnies', 'notes');
    await queryInterface.removeColumn('Rides', 'memo');
  
  
    
  }
};
