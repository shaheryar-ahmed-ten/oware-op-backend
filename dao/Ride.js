const CrudServiceDao = require("./crudService");

class RideDao extends CrudServiceDao {
  constructor() {
    super("Ride");
  }
}

module.exports = new RideDao();
