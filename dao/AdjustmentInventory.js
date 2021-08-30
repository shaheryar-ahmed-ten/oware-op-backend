const CrudServiceDao = require("./crudService");

class AdjustmentInventoryDao extends CrudServiceDao {
  constructor() {
    super("AdjustmentInventory");
  }
}

module.exports = new AdjustmentInventoryDao();
