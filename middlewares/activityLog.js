const { ActivityLog, ActivitySourceType } = require("../models");
const sourceModel = require("../models");
const { getModel } = require("../services/common.services");

async function addActivityLog(req, res, next) {
  const modelUrl = req.originalUrl.split("/");
  let MODEL = getModel(modelUrl[3]);
  const sourceTypeId = (await ActivitySourceType.findOne({ where: { name: MODEL } })).id;
  if (req.method == "POST") {
    if (MODEL != "Upload") {
      console.log("sourceModel", sourceModel);
      let source = await sourceModel[MODEL].findOne({ order: [["createdAt", "DESC"]], limit: 1, attributes: ["id"] });
      source = source ? source.id : 1;
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: req.body,
        previousPayload: null,
        sourceId: source ? source + 1 : 1,
        sourceType: sourceTypeId,
        activityType: "ADD",
      });
    } else {
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: req.body,
        previousPayload: null,
        sourceId: null,
        sourceType: sourceTypeId,
        activityType: "ADD",
      });
    }
  } else if (req.method == "PUT") {
    if (MODEL != "Upload") {
      const source = await sourceModel[MODEL].findOne({ where: { id: req.params.id } });
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: null,
        previousPayload: source,
        sourceId: req.params.id,
        sourceType: sourceTypeId,
        activityType: "EDIT",
      });
      req["activityLogId"] = log.id;
    } else {
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: req.body,
        previousPayload: null,
        sourceId: null,
        sourceType: sourceTypeId,
        activityType: "PUT",
      });
    }
  } else if (req.method == "DELETE") {
    if (MODEL != "Upload") {
      const source = await sourceModel[MODEL].findOne({ order: [["createdAt", "DESC"]], limit: 1 });
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: null,
        previousPayload: source,
        sourceId: req.params.id,
        sourceType: sourceTypeId,
        activityType: "DELETE",
      });
    } else {
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: null,
        previousPayload: null,
        sourceId: req.params.id,
        sourceType: sourceTypeId,
        activityType: "DELETE",
      });
    }
  }
  next();
}

module.exports = addActivityLog;
