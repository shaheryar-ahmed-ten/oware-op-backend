"use strict";
const {
  DISPATCH_ORDER: { STATUS }
} = require("../enums");
const { sequelize } = require("../models");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("DispatchOrders", "status", {
      type: Sequelize.STRING,
      defaultValue: STATUS.PENDING,
      allowNull: false
    });
    await sequelize.query(`update DispatchOrders do set status = '${STATUS.FULFILLED}'
    where id in (select * from(select do.id
    from DispatchOrders do 
    inner join ProductOutwards po on do.id = po.dispatchOrderId 
    inner join OutwardGroups og2 on po.id = og2.outwardId 
    group by do.id 
    having do.quantity = sum(og2.quantity) and sum(og2.quantity) > 0)tblTmp)`);

    await sequelize.query(`update DispatchOrders do set status = '${STATUS.PARTIALLY_FULFILLED}'
    where id in (select * from(select do.id
    from DispatchOrders do 
    inner join ProductOutwards po on do.id = po.dispatchOrderId 
    inner join OutwardGroups og2 on po.id = og2.outwardId 
    group by do.id 
    having do.quantity > sum(og2.quantity) and sum(og2.quantity) > 0)tblTmp)`);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("DispatchOrders", "status");
  }
};
