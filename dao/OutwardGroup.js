const CrudServiceDao = require("./crudService");

class OutwardGroup extends CrudServiceDao {
  constructor() {
    super("OutwardGroup");
  }
}

module.exports = new OutwardGroup();
