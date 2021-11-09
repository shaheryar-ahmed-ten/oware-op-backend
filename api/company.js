const express = require("express");
const router = express.Router();
const { Company, User, Role, File } = require("../models");
const { Op } = require("sequelize");
const config = require("../config");
const authService = require("../services/auth.service");
const { PORTALS, initialInternalIdForBusinessForCompany, initialInternalIdForBusinessForVendor } = require("../enums");
const RELATION_TYPES = require("../enums/relationTypes");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const { addActivityLog, digitize } = require("../services/common.services");

/* GET customers listing. */
router.get("/:relationType", async (req, res, next) => {
  let relationType = req.params.relationType.toUpperCase();
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = { relationType };
  if (!authService.isSuperAdmin(req)) where.contactId = req.userId;
  if (req.query.search)
    where[Op.or] = ["name", "$Contact.email$", "$Contact.firstName$", "$Contact.lastName$"].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));
  const response = await Company.findAndCountAll({
    include: [{ model: User }, { model: User, as: "Contact", required: true }, { model: User, as: "Employees" }],
    order: [["updatedAt", "DESC"]],
    limit,
    offset,
    where,
    distinct: true
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
      internalIdForBusiness: req.body.relationType === 'CUSTOMER' ?
        initialInternalIdForBusinessForCompany
        :
        initialInternalIdForBusinessForVendor
      ,
      ...req.body,
      relationType: req.params.relationType,
    });

    const numberOfInternalIdForBusiness = digitize(customer.id, 6);
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
  try {
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
      message: err.errors.pop().message,
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

module.exports = router;
