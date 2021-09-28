const CrudServiceDao = require("./crudService");
const sourceModel = require("../models");

class ActivityLogDao extends CrudServiceDao {
  constructor() {
    super("ActivityLog");
  }
  async findAndCountAll(params) {
    const { offset, limit, sort, where } = params;
    let { includeAll = false, include, attributes } = params;
    const _params = { limit, offset, order: sort, where, distinct: true };
    if (includeAll) _params.include = [{ all: true }];
    if (include) _params.include = include;
    if (attributes) _params.attributes = attributes;
    const { count, rows } = await this.model.findAndCountAll(_params);
    if (!rows) return [];
    return { count, records: rows };
  }
}

module.exports = new ActivityLogDao();
