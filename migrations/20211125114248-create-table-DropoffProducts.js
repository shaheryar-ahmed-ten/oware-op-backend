"use strict";
const momenttz = require("moment-timezone");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // await queryInterface.createTable("DropoffProducts", {
    //   id: {
    //     allowNull: false,
    //     autoIncrement: true,
    //     primaryKey: true,
    //     type: Sequelize.INTEGER,
    //   },
    //   dropoffId: {
    //     type: Sequelize.INTEGER,
    //     allowNull: false,
    //     references: {
    //       model: "RideDropoffs",
    //       key: "id",
    //     },
    //   },
    //   name: Sequelize.STRING,
    //   quantity: Sequelize.INTEGER,
    //   categoryId: {
    //     type: Sequelize.INTEGER,
    //     allowNull: false,
    //     references: {
    //       model: "Categories", // name of Target model
    //       key: "id", // key in Target model that we're referencing
    //     },
    //   },
    //   createdAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE,
    //     defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    //   },
    //   updatedAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE,
    //     defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
    //   },
    //   deletedAt: {
    //     allowNull: true,
    //     type: Sequelize.DATE,
    //   },
    // });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // await queryInterface.dropTable("DropoffProducts");
  },
};
