const CrudServiceDao = require("./crudService");

class WarehouseDao extends CrudServiceDao {
  constructor() {
    super("Warehouse");
  }
}

module.exports = new WarehouseDao();
