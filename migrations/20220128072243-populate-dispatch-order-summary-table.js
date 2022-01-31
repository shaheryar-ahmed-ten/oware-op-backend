'use strict';
const { DispatchOrderSummary, DispatchOrder, Inventory, Product, UOM, Company, Warehouse, User } = require("../models");
const moment = require("moment");
const { handleHookError } = require("../utility/utility");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    try {
      var limit = 10
      var totalDispatchOrdersCounts = await DispatchOrder.count();
      var count = 10;
      var page = 1;

      while (count <= totalDispatchOrdersCounts) {
        var offset = (page - 1 || 0) * limit;

        var response = await DispatchOrder.findAll({
          include: [
            {
              model: Inventory,
              as: "Inventory",
              include: [
                { model: Product, include: [{ model: UOM }] },
                { model: Company },
                { model: Warehouse },
              ],
            },
            {
              model: Inventory,
              as: "Inventories",
              include: [
                {
                  model: Product,
                  include: [
                    {
                      model: UOM,
                      attributes: ["name"]
                    }
                  ],
                  attributes: ["name"]
                },
                {
                  model: Company,
                  attributes: ["name"]
                },
                {
                  model: Warehouse,
                  attributes: ["name"]
                },
              ],
            },
            {
              model: User,
              attributes: ["id", "firstName", "lastName"]
            },
          ],
          attributes: ["updatedAt", "id", "internalIdForBusiness", "receiverName", "receiverPhone", "referenceId", "createdAt", "shipmentDate", "status", "orderMemo"],
          limit,
          offset,
        });

        const orderArray = [];
        for (const order of response) {
          for (const inv of order.Inventories) {
            orderArray.push({
              dispatchOrderId: order.internalIdForBusiness || "",
              customerName: inv.Company.name,
              productName: inv.Product.name,
              warehouseName: inv.Warehouse.name,
              uom: inv.Product.UOM.name,
              receiverName: order.receiverName,
              receiverPhone: order.receiverPhone,
              requestedQuantity: inv.OrderGroup.quantity,
              referenceId: order.referenceId || "",
              creatorName: `${order.User.firstName || ""} ${order.User.lastName || ""}`,
              userId: order.User.id,
              createdAt: order.createdAt,
              shipmentDate: Date.parse(order.shipmentDate) ? Date.parse(order.shipmentDate) : order.createdAt,
              status: order.status === 'Pending' ? 0 : order.status,
              orderMemo: order.orderMemo || "",
            });
          }
        }

        await DispatchOrderSummary.bulkCreate(
          orderArray
        )
        console.log("migration running (Dispatch Order Summary)")
        console.log("Completed Records", count)
        console.log("Total Records", totalDispatchOrdersCounts)
        console.log("Remianing Records", totalDispatchOrdersCounts - count)
        if (count == totalDispatchOrdersCounts) {
          break
        }
        count = count + 10
        page++;
        if (count > totalDispatchOrdersCounts) {
          count = totalDispatchOrdersCounts
        }
      }

    } catch (err) {
      handleHookError(err, "Populate Migration")
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return DispatchOrderSummary.destroy({
      where: {}
    });
  }
};
