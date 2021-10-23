'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    await queryInterface.addColumn('Rides', 'weightCargo',{
        type: Sequelize.FLOAT,
        defaultvalue: 0,
        allowNull: true,
      },
    );
    await queryInterface.addColumn('Rides', 'pocName', {
        type: Sequelize.STRING,
        allowNull: true,
      },
    );
    await queryInterface.addColumn('Rides', 'pocNumber', {
        type: Sequelize.STRING,
        allowNull: true,
      },
    );

    await queryInterface.addColumn('Rides', 'eta', {
        type: Sequelize.STRING,
        allowNull: true,
      },
    );
    await queryInterface.addColumn('Rides', 'completionTime', {
        type: Sequelize.STRING,
        allowNull: true,
      },
    );
    await queryInterface.addColumn('Rides', 'eirId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Files', // name of Target model
        key: 'id', // key in Target model that we're referencing
      }
      },
    );
    await queryInterface.addColumn('Rides', 'builtyId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Files', // name of Target model
          key: 'id', // key in Target model that we're referencing
        }
        },
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Rides", "weightCargo");
    await queryInterface.removeColumn("Rides", "pocName");
    await queryInterface.removeColumn("Rides", "pocNumber");
    await queryInterface.removeColumn("Rides", "eta");
    await queryInterface.removeColumn("Rides", "completionTime");
    await queryInterface.removeColumn("Rides", "eirId");
    await queryInterface.removeColumn("Rides", "builtyId");
   
  }
};
