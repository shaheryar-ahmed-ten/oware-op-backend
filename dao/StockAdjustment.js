const CrudServiceDao = require("./crudService");
const Dao = require(".");
const { Inventory } = require("../models");

class StockAdjustmentDao extends CrudServiceDao {
  constructor() {
    super("StockAdjustment");
  }

  async delete(response) {
    const { id, adjustmentQuantity, inventoryId } = response;
    const inventory = await Inventory.findByPk(inventoryId);
    if (inventory) {
      inventory.availableQuantity = inventory.availableQuantity + adjustmentQuantity;
      await inventory.save();
    }
    const record = await this.model.update(
      { deletedAt: new Date() },
      {
        where: { id: id },
        returning: true,
        plain: true
      }
    );
    return `deleted at id=${id}`;
  }
}

module.exports = new StockAdjustmentDao();
