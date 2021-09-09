const CrudServiceDao = require("./crudService");

class InventoryDao extends CrudServiceDao {
  constructor() {
    super("Inventory");
  }
}

module.exports = new InventoryDao();
