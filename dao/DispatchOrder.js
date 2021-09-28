const CrudServiceDao = require("./crudService");

class DispatchOrder extends CrudServiceDao {
  constructor() {
    super("DispatchOrder");
  }
}

module.exports = new DispatchOrder();
