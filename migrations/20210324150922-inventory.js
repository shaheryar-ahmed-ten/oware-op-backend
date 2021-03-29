'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    // logic for transforming into the new state
    await queryInterface.sequelize.query(`
      create view Inventories as select PI.customerId,
          PI.warehouseId,
          PI.productId,
          Product.name as product,
          UOM.name as uom,
          Warehouse.name as warehouse,
          Customer.companyName as customer,
          COALESCE(sum(PI.quantity), 0) as quantity,
          COALESCE(sum(DO.quantity), 0) as committedQuantity,
          COALESCE(sum(PO.quantity), 0) as dispatchedQuantity
          from ProductInwards as PI
          LEFT JOIN DispatchOrders as DO
          ON PI.customerId = DO.customerId
          AND PI.warehouseId = DO.warehouseId
          AND PI.productId = DO.productId
          INNER JOIN ProductOutwards as PO on PO.dispatchOrderId = DO.id
          LEFT JOIN Products as Product ON PI.productId=Product.id
          LEFT JOIN Warehouses as Warehouse ON PI.warehouseId=Warehouse.id
          LEFT JOIN Customers as Customer ON PI.customerId=Customer.id
          LEFT JOIN UOMs as UOM ON Product.uomId=UOM.id
        group by PI.customerId, PI.productId, PI.warehouseId
        ;
        `);
  },

  down: async function (queryInterface, Sequelize) {
    // logic for reverting the changes
    await queryInterface.sequelize.query('drop view Inventories');
  }
}
