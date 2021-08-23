const CrudServiceDao = require("./crudService");
const { encrypt } = require("../library/encryption");

class WarehouseWastageDao extends CrudServiceDao {
  constructor() {
    super("WarehouseWastage");
  }
}

module.exports = new WarehouseWastageDao();
