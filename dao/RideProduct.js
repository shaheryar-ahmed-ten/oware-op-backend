const CrudServiceDao = require("./crudService");

class RideProduct extends CrudServiceDao {
  constructor() {
    super("RideProduct");
  }
}

module.exports = new RideProduct();
