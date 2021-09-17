const router = require("express").Router();
const controller = require("./controller");
const httpStatus = require("http-status");
const config = require("../../config");
const addActivityLog = require("../../middlewares/activityLog");
const { User, ActivitySourceType } = require("../../models");

const sourceModel = require("../../models");

const { Op } = require("sequelize");
const moment = require("moment");
const Dao = require("../../dao");

router.get("/", async (req, res) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  const where = {};
  if (req.query.search)
    where[Op.or] = ["$User.firstName$", "$User.lastName$", "$ActivitySourceType.name$"].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));
  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  }
  const params = {
    limit,
    offset,
    include: [
      { model: User, as: "User", attributes: ["id", "firstName", "lastName"], required: true },
      { model: ActivitySourceType, as: "ActivitySourceType", attributes: ["id", "name", "hasInternalIdForBusiness"] },
    ],
    where,
    sort: [["createdAt", "DESC"]],
  };
  const response = await controller.getActivityLogs(params);
  if (response.success === httpStatus.OK)
    res.sendJson(response.data, response.message, response.success, response.pages);
  else res.sendError(response.status, response.message, response.error);
});

module.exports = router;
