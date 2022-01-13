"use strict";
const { Inventory } = require("../models");
const { Op } = require("sequelize");
const { response } = require("express");
const { digitize } = require("../services/common.services");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    try {
      let count = 0;
      await queryInterface.sequelize.transaction(async (transaction) => {
        const inventories = await Inventory.findAll({ transaction });
        for (const inventory of inventories) {
          queryInterface.sequelize.query(
            `INSERT INTO InventoryDetails (batchNumber,inventoryId,inwardQuantity,availableQuantity,outwardQuantity,internalIdForBusiness) 
        VALUES (null,'${inventory.id}',${inventory.totalInwardQuantity},${inventory.totalInwardQuantity}-${
              inventory.dispatchedQuantity
            },${inventory.dispatchedQuantity},'default-${inventory.id}-${digitize(++count, 6)}')`
          );
        }
      });
    } catch (err) {
      console.log("err", err);
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.sequelize.query(`DELETE FROM InventoryDetails;`);
    queryInterface.sequelize.query(`ALTER TABLE InventoryDetails AUTO_INCREMENT=0;`);
  },
};
