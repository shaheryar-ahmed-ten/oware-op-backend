const CrudServiceDao = require("./crudService");

class UOM extends CrudServiceDao {
  constructor() {
    super("UOM");
  }
}

module.exports = new UOM();
