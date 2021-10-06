const CrudServiceDao = require("./crudService");

class OrderGroup extends CrudServiceDao {
  constructor() {
    super("OrderGroup");
  }
}

module.exports = new OrderGroup();
