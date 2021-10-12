const CrudServiceDao = require("./crudService");

class Ride extends CrudServiceDao {
  constructor() {
    super("Ride");
  }
}

module.exports = new Ride();
