const CrudServiceDao = require("./crudService");

class RideDropoff extends CrudServiceDao {
  constructor() {
    super("RideDropoff");
  }
}

module.exports = new RideDropoff();
