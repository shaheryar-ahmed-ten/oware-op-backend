const CrudServiceDao = require("./crudService");

class Brand extends CrudServiceDao {
  constructor() {
    super("Brand");
  }
}

module.exports = new Brand();
