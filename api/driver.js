const express = require("express");
const router = express.Router();
const { Company, Driver, File } = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const { RELATION_TYPES } = require("../enums");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const { addActivityLog } = require("../services/common.services");
/* GET drivers listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search)
    where[Op.or] = ["name", "$Vendor.name$"].map((key) => ({ [key]: { [Op.like]: "%" + req.query.search + "%" } }));
  // console.log("driver companyId",req.query.companyId)
  if (req.query.companyId) where[Op.and] = [{ companyId: Number(req.query.companyId) }];
  const response = await Driver.findAndCountAll({
    include: [
      {
        model: Company,
        as: "Vendor",
      },
      {
        model: File,
        as: "DrivingLicense",
      },
      {
        model: File,
        as: "Cnic",
      },
    ],
    order: [["updatedAt", "DESC"]],
    where,
    limit,
    offset,
  });
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    pages: Math.ceil(response.count / limit),
  });
});

/* POST create new driver. */
router.post("/", activityLog, async (req, res, next) => {
  let message = "New driver registered";
  let driver;
  try {
    driver = await Driver.create({
      userId: req.userId,
      ...req.body,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
  res.json({
    success: true,
    message,
    data: driver,
  });
});

/* PUT update existing driver. */
router.put("/:id", activityLog, async (req, res, next) => {
  let driver = await Driver.findOne({ where: { id: req.params.id } });
  if (!driver)
    return res.status(400).json({
      success: false,
      message: "No driver found!",
    });
  driver.name = req.body.name;
  driver.companyId = req.body.companyId;
  driver.phone = req.body.phone;
  driver.cnicNumber = req.body.cnicNumber;
  driver.cnicId = req.body.cnicId;
  driver.drivingLicenseNumber = req.body.drivingLicenseNumber;
  driver.drivingLicenseId = req.body.drivingLicenseId;
  try {
    const response = await driver.save();
    await addActivityLog(req["activityLogId"], response, Dao.ActivityLog);
    return res.json({
      success: true,
      message: "driver updated",
      data: response,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message,
    });
  }
});

router.delete("/:id", activityLog, async (req, res, next) => {
  let response = await Driver.destroy({ where: { id: req.params.id } });
  if (response)
    res.json({
      success: true,
      message: "driver deleted",
    });
  else
    res.status(400).json({
      success: false,
      message: "No driver found!",
    });
});

router.get("/relations", async (req, res, next) => {
  let where = { relationType: RELATION_TYPES.VENDOR };
  const companies = await Company.findAll({
    where,
  });
  res.json({
    success: true,
    message: "respond with a resource",
    companies,
  });
});

module.exports = router;
