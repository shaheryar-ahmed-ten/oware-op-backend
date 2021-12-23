const CrudServiceDao = require("./crudService");

class RideCancellationReason extends CrudServiceDao {
  constructor() {
    super("RideCancellationReason");
  }
}

module.exports = new RideCancellationReason();
