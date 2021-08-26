const CrudServiceDao = require("./crudService");

class CompanyDao extends CrudServiceDao {
  constructor() {
    super("Company");
  }
}

module.exports = new CompanyDao();
