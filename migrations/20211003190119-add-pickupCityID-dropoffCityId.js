"use strict";
const Dao = require("../dao");
const { Area, City, Zone } = require("../models");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface
      .addColumn("Rides", "pickupCityId", {
        type: Sequelize.INTEGER,
        allowNull: true,
      })
      .then(function () {
        queryInterface.sequelize.query(`update Rides r 
      inner join Areas a on r.pickupAreaId = a.id 
      inner join Zones z on a.zoneId =  z.id 
      inner join Cities c on z.cityId  = c.id
      set pickupCityId = c.id`);
      });
    await queryInterface
      .addColumn("Rides", "dropoffCityId", {
        type: Sequelize.INTEGER,
        allowNull: true,
      })
      .then(function () {
        queryInterface.sequelize.query(`update Rides r 
      inner join Areas a on r.dropoffAreaId = a.id 
      inner join Zones z on a.zoneId =  z.id 
      inner join Cities c on z.cityId  = c.id
      set dropoffCityId = c.id`);
      });

    await queryInterface.changeColumn("Rides", "pickupCityId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Cities", // name of Target model
        key: "id", // key in Target model that we're referencing
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await queryInterface.changeColumn("Rides", "dropoffCityId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Cities", // name of Target model
        key: "id", // key in Target model that we're referencing
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await queryInterface.removeColumn("Rides", "pickupAreaId");
    await queryInterface.removeColumn("Rides", "dropoffAreaId");
    await queryInterface.dropTable("Areas");
    await queryInterface.dropTable("Zones");
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("Rides", "pickupCityId");
    await queryInterface.removeColumn("Rides", "dropoffCityId");
    await queryInterface.addColumn("Rides", "pickupAreaId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Areas", // name of Target model
        key: "id", // key in Target model that we're referencing
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addColumn("Rides", "dropoffAreaId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Areas", // name of Target model
        key: "id", // key in Target model that we're referencing
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.createTable("Zones", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: { type: Sequelize.STRING },
      cityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Cities", // name of Target model
          key: "id", // key in Target model that we're referencing
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users", // name of Target model
          key: "id", // key in Target model that we're referencing
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      isActive: Sequelize.BOOLEAN,
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable("Areas", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: { type: Sequelize.STRING },
      zoneId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Zones", // name of Target model
          key: "id", // key in Target model that we're referencing
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users", // name of Target model
          key: "id", // key in Target model that we're referencing
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      isActive: Sequelize.BOOLEAN,
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        type: Sequelize.DATE,
      },
    });
  },
};
