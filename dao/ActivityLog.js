const CrudServiceDao = require("./crudService");

class ActivityLogDao extends CrudServiceDao {
  constructor() {
    super("ActivityLog");
  }
}

module.exports = new ActivityLogDao();
