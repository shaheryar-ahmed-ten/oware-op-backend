const CrudServiceDao = require("./crudService");

class DropoffProductDao extends CrudServiceDao {
  constructor() {
    super("DropoffProduct");
  }
}

module.exports = new DropoffProductDao();
