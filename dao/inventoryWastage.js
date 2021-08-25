const CrudServiceDao = require("./crudService");

class InventoryWastageDao extends CrudServiceDao {
  constructor() {
    super("InventoryWastage");
  }
}

module.exports = new InventoryWastageDao();
