const CrudServiceDao = require("./crudService");
const Dao = require("../dao");
const { Inventory } = require("../models");

class InventoryWastageDao extends CrudServiceDao {
  constructor() {
    super("InventoryWastage");
  }

  async delete(response) {
    const { id, adjustmentQuantity, inventoryId } = response;
    console.log("Dao", Dao);
    const inventory = await Inventory.findByPk(inventoryId);
    console.log("inventory1", inventory.dataValues);
    if (inventory) {
      inventory.availableQuantity = inventory.availableQuantity + adjustmentQuantity;
      await inventory.save();
    }
    console.log("inventory2", inventory.dataValues);

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

module.exports = new InventoryWastageDao();
