const models = require("../models");
const { encrypt } = require("../library/encryption");

class CrudServiceDao {
  constructor(modelName) {
    this.modelName = modelName;
    this.model = models[modelName];
  }

  async findOne(key) {
    const record = await this.model.findOne({
      where: { ...key, deletedAt: null },
      include: [{ all: true }]
    });
    return record;
  }

  async findAndCountAll(params) {
    const { offset, limit, filters, sort } = params;
    let { includeAll = false, include, attributes } = params;
    const _params = { limit, offset, order: sort };
    if (includeAll) _params.include = [{ all: true }];
    if (include) _params.include = include;
    if (attributes) _params.attributes = attributes;
    _params.where.deletedAt = null;
    const { count, rows } = await this.model.findAndCountAll(_params);
    if (!rows) return [];
    return { count, records: rows };
  }

  async create(params) {
    params.password = params.password ? encrypt(params.password) : undefined;
    const record = await this.model.create(params);
    return record;
  }

  async bulkCreate(params) {
    const record = await this.model.bulkCreate(params);
    return record;
  }

  async update(params, id) {
    let record1 = await this.model.findOne({
      where: { id: id, deletedAt: null }
    });
    if (record1) {
      record1 = await this.model.update(params, {
        where: { id: id },
        returning: true,
        plain: true
      });
      record1 = await this.model.findOne({
        where: { id: id, deletedAt: null }
      });
      return record1;
    } else return null;
  }

  async delete(id) {
    const record = await this.model.update(
      { deletedAt: new Date() },
      {
        where: { id: id },
        returning: true,
        plain: true
      }
    );
    return `deleted at id=${id}`;
  }

  async hardDelete(id) {
    const record = await this.model.destroy({ where: { id } });
  }

  async find(term) {
    const record = await this.model.findOne({
      where: { id: term }
    });
    return record ? record : [];
  }
}

module.exports = CrudServiceDao;
