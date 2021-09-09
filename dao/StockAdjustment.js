const CrudServiceDao = require("./crudService");
const AdjustmentInventory = require("./AdjustmentInventory");
const { Inventory } = require("../models");

class StockAdjustmentDao extends CrudServiceDao {
  constructor() {
    super("StockAdjustment");
  }

  async delete(adjustmentId) {
    const inventories = await AdjustmentInventory.findAll({
      where: { adjustmentId },
      include: ["Inventory"]
    });
    if (inventories) {
      for (const adjInventory of inventories) {
        adjInventory.Inventory.availableQuantity += adjInventory.adjustmentQuantity;
        adjInventory.Inventory.save();
      }
    }
    const record = await this.model.destroy({
      where: { id: adjustmentId }
    });
    return `deleted at id=${adjustmentId}`;
  }
}

module.exports = new StockAdjustmentDao();
