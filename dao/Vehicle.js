const CrudServiceDao = require("./crudService");

class Vehicle extends CrudServiceDao {
  constructor() {
    super("Vehicle");
  }
}

module.exports = new Vehicle();
