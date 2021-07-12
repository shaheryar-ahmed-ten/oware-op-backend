'use strict';

const viewName = 'OutboundStats';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
        CREATE VIEW ${viewName} AS
        SELECT ROW_NUMBER() OVER(ORDER BY (SELECT 1)) id,
          Inventories.customerId,
          Inventories.warehouseId,
          Inventories.productId,
          Product.name AS product,
          PO.quantity * Product.weight AS weight,
          PO.quantity * Product.dimensionsCBM AS dimensionsCBM,
          COALESCE(PO.quantity, 0) AS productOutwardQuantity,
          UOM.name AS uom,
          Warehouse.name AS warehouse,
          Company.name AS customer,
          DO.referenceId AS referenceId,
          DO.internalIdForBusiness AS internalIdForBusiness,
          DO.id AS dispatchOrderId,
          DO.shipmentDate AS shipmentDate,
          DO.quantity AS dispatchOrderQuantity,
          PO.vehicleId AS vehicleId,
          PO.id AS productOutwardId,
          DO.createdAt AS dispatchOrderCreatedAt,
          PO.deletedAt AS deletedAt,
          PO.updatedAt AS updatedAt,
          PO.createdAt AS createdAt
          FROM ProductOutwards AS PO
          RIGHT JOIN DispatchOrders AS DO ON PO.dispatchOrderId = DO.id
          LEFT JOIN Inventories ON DO.inventoryId = Inventories.id
          LEFT JOIN Products AS Product ON Inventories.productId = Product.id
          LEFT JOIN Warehouses AS Warehouse ON Inventories.warehouseId = Warehouse.id
          LEFT JOIN Companies AS Company ON Inventories.customerId = Company.id
          LEFT JOIN UOMs AS UOM ON Product.uomId = UOM.id;
  `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`DROP VIEW ${viewName};`);
  }
};
