const models = require("../models");

class CrudServiceDao {
  constructor(modelName) {
    this.modelName = modelName;
    this.model = models[modelName];
  }

  async findOne(params) {
    const record = await this.model.findOne(params);
    return record;
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

  async findAll(params) {
    const { where } = params;
    let { includeAll = false, include, attributes } = params;
    const _params = { where };
    if (includeAll) _params.include = [{ all: true }];
    if (include) _params.include = include;
    if (attributes) _params.attributes = attributes;
    return await this.model.findAll(_params);
  }

  async findAll() {
    return await this.model.findAll();
  }

  async create(params) {
    const record = await this.model.create(params);
    return record;
  }

  async bulkCreate(params) {
    const record = await this.model.bulkCreate(params);
    return record;
  }

  async update(params, id) {
    let record = await this.model.findOne({
      where: { id: id, deletedAt: null },
    });
    if (record) {
      record = await this.model.update(params, {
        where: { id: id },
        returning: true,
        plain: true,
      });
      record = await this.model.findOne({
        where: { id: id, deletedAt: null },
      });
      return record;
    } else return null;
  }

  async delete(id) {
    const record = await this.model.update(
      { deletedAt: new Date() },
      {
        where: { id: id },
        returning: true,
        plain: true,
      }
    );
    return record;
  }

  async destroy(params) {
    const record = await this.model.destroy(params);
  }

  async findByPk(id) {
    const record = await this.model.findByPk(id);
    return record ? record : null;
  }

  async count(params) {
    const count = await this.model.count(params);
    return count;
  }
}

module.exports = CrudServiceDao;
