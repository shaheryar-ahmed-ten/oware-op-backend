const express = require("express");
const router = express.Router();
const { Company, User, Role, File } = require("../models");
const { Op } = require("sequelize");
const config = require("../config");
const authService = require("../services/auth.service");
const { PORTALS, initialInternalIdForBusinessForCompany, initialInternalIdForBusinessForVendor } = require("../enums");
const RELATION_TYPES = require("../enums/relationTypes");
const activityLog = require("../middlewares/activityLog");
const ExcelJS = require("exceljs");
const moment = require("moment-timezone");
const Dao = require("../dao");
const { addActivityLog, digitize } = require("../services/common.services");
const httpStatus = require("http-status");

/* GET customers listing. */
router.get("/:relationType", async (req, res, next) => {
  let relationType = req.params.relationType.toUpperCase();
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = { relationType };
  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  }

  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  } else if (req.query.startingDate && req.query.endingDate) {
    const startDate = moment(req.query.startingDate).utcOffset("+05:00").set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const endDate = moment(req.query.endingDate).utcOffset("+05:00").set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 1000,
    });
    where["createdAt"] = { [Op.between]: [startDate, endDate] };
  }
  if (!authService.isSuperAdmin(req)) where.contactId = req.userId;
  if (req.query.search)
    where[Op.or] = ["internalIdForBusiness","type","name", "$Contact.email$", "$Contact.firstName$", "$Contact.lastName$"].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));
  const response = await Company.findAndCountAll({
    include: [
      { model: User },
      { model: User, as: "Contact", required: true },
      { model: User, as: "Employees" },
      { model: User, as: "pocUser" },
    ],
    order: [["updatedAt", "DESC"]],
    limit,
    offset,
    where,
    distinct: true,
  });

  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    pages: Math.ceil(response.count / limit),
  });
});

/* POST create new customer. */
router.post("/:relationType", activityLog, async (req, res, next) => {
  let message = "New Customer registered";
  let customer;
  try {
    customer = await Company.create({
      userId: req.userId,
      internalIdForBusiness:
        req.body.relationType === "CUSTOMER"
          ? initialInternalIdForBusinessForCompany
          : initialInternalIdForBusinessForVendor,
      ...req.body,
      relationType: req.params.relationType,
    });

    // find the total no. of comapanies/vendors created
    let where = { relationType: req.params.relationType };
    const response = await Company.findAndCountAll({
      where,
    });

    const numberOfInternalIdForBusiness = digitize(response.count, 6);
    customer.internalIdForBusiness = customer.internalIdForBusiness + numberOfInternalIdForBusiness;
    customer.save();
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }

  res.json({
    success: true,
    message,
    data: customer,
  });
});

/* PUT update existing customer. */
router.put("/:relationType/:id", activityLog, async (req, res, next) => {
  let customer = await Company.findOne({ where: { id: req.params.id } });
  if (!customer)
    return res.status(400).json({
      success: false,
      message: "No customer found!",
    });
  customer.name = req.body.name;
  customer.type = req.body.type;
  customer.relationType = req.body.relationType;
  customer.internalIdForBusiness = req.body.internalIdForBusiness;
  customer.contactId = req.body.contactId;
  customer.notes = req.body.notes;
  customer.isActive = req.body.isActive;
  customer.logoId = req.body.logoId;
  customer.phone = req.body.phone;
  customer.pocUserId = req.body.pocUserId;
  try {
    if (req.params.relationType === "CUSTOMER" && req.body.isActive === true && !req.body.pocUserId) {
      throw new Error("Please add a POC user");
    }
    const response = await customer.save();
    await addActivityLog(req["activityLogId"], response, Dao.ActivityLog);
    return res.json({
      success: true,
      message: "Customer updated",
      data: response,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
});

router.delete("/:relationType/:id", activityLog, async (req, res, next) => {
  let response = await Company.destroy({ where: { id: req.params.id } });
  if (response)
    res.json({
      success: true,
      message: "Customer deleted",
    });
  else
    res.status(400).json({
      success: false,
      message: "No customer found!",
    });
});

router.get("/:relationType/relations/:id", async (req, res, next) => {
  let where = { isActive: true };
  where["$Role.allowedApps$"] = PORTALS.OPERATIONS;
  const users = await User.findAll({ where, include: [Role] });
  const customerTypes = config.customerTypes;
  const relationTypes = RELATION_TYPES;
  res.json({
    success: true,
    message: "respond with a resource",
    users,
    customerTypes,
    relationTypes,
  });
});

router.get("/:relationType/relations", async (req, res, next) => {
  let where = { isActive: true };
  where["$Role.allowedApps$"] = PORTALS.OPERATIONS;
  const users = await User.findAll({ where, include: [Role] });
  const customerTypes = config.customerTypes;
  const relationTypes = RELATION_TYPES;
  res.json({
    success: true,
    message: "respond with a resource",
    users,
    customerTypes,
    relationTypes,
  });
});

router.get("/poc-users/:company", async (req, res, next) => {
  try {
    const company = await Dao.Company.findOne({
      where: { id: req.params.company },
      include: [{ model: User, as: "Employees", where: { isActive: 1 } }],
    });
    if (company) {
      res.sendJson(company.Employees, "company user found", true);
    } else {
      res.sendError(httpStatus.NOT_FOUND, null, "Failed to find company user");
    }
  } catch (err) {
    res.sendError(httpStatus.CONFLICT, err, "Failed to find company user");
  }
});


router.get("/:relationType/export", async (req, res, next) => {
  // let where = { };
  let relationType = req.params.relationType.toUpperCase();
  let where = {relationType };
  // where["$Role.allowedApps$"] = PORTALS.OPERATIONS;
  // const users = await User.findAll({ where, include: [Role] });
  // const customerTypes = config.customerTypes;
  // const relationTypes = RELATION_TYPES;
//   let where = {};
//   if (!authService.isSuperAdmin(req)) where["$Company.contactId$"] = req.userId;

  let workbook = new ExcelJS.Workbook();

  let worksheet = workbook.addWorksheet(relationType == "CUSTOMER" ? "Companies": "Vendors");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({ header: column, width: Math.ceil(column.length * 1.5), outlineLevel: 1 }));

  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  } else if (req.query.startingDate && req.query.endingDate) {
    const startDate = moment(req.query.startingDate).utcOffset("+05:00").set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const endDate = moment(req.query.endingDate).utcOffset("+05:00").set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 1000,
    });
    where["createdAt"] = { [Op.between]: [startDate, endDate] };
  }

  if (req.query.search)
  where[Op.or] = ["internalIdForBusiness","type","name", "$Contact.email$", "$Contact.firstName$", "$Contact.lastName$"].map((key) => ({
    [key]: { [Op.like]: "%" + req.query.search + "%" },
  }));

  if (!authService.isSuperAdmin(req)) where.contactId = req.userId;
  response = await Company.findAll({
    include: [
      { model: User, as: "Contact" }
  ],
    order: [["updatedAt", "DESC"]],
    where,
  });

  worksheet.columns = getColumnsConfig([
    "COMPANY ID",
    "COMPANY NAME",
    "COMPANY TYPE",
    "CONTACT NAME",
    "CONTACT EMAIL",
    "CONTACT PHONE",
    "NOTES",
    "STATUS",
  ]);

  worksheet.addRows(
    response.map((row) => [
      row.internalIdForBusiness || "",
      row.name,
      row.type,
      row.Contact.firstName + " " + row.Contact.lastName,
      row.Contact.email,
      row.Contact.phone,
      row.notes,
      row.isActive ? "Active" : "In-Active",
    ])
  );

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  await workbook.xlsx.write(res).then(() => res.end());
});
module.exports = router;
