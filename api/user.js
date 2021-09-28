const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { User, Role, PermissionAccess, Permission, Company } = require("../models");
const config = require("../config");
const { isLoggedIn, checkPermission, isSuperAdmin } = require("../services/auth.service");
const { Op } = require("sequelize");
const { PERMISSIONS, PORTALS, RELATION_TYPES } = require("../enums");
const PORTALS_LABELS = require("../enums/portals");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const { addActivityLog } = require("../services/common.services");

async function updateUser(req, res, next) {
  let user = await User.findOne({ where: { id: req.params.id } });
  if (!user)
    return res.status(400).json({
      success: false,
      message: "No user found!",
    });
  if (req.body.hasOwnProperty("firstName")) user.firstName = req.body.firstName;
  if (req.body.hasOwnProperty("lastName")) user.lastName = req.body.lastName;
  if (req.body.hasOwnProperty("roleId")) user.roleId = Number(req.body.roleId);
  if (req.body.hasOwnProperty("phone")) user.phone = req.body.phone;
<<<<<<< HEAD
  if (req.body.hasOwnProperty("companyId")) user.companyId = Number(req.body.companyId);
=======
  if (req.body.hasOwnProperty("companyId") && req.body.companyId.length) user.companyId = Number(req.body.companyId);
>>>>>>> dda427eb1efd8c9dcda2c850ee79c2cb834e2f04
  if (req.body.hasOwnProperty("password")) user.password = req.body.password;
  if (req.body.hasOwnProperty("isActive")) user.isActive = req.body.isActive;
  try {
    const response = await user.save();
    console.log("response", response);
    await addActivityLog(req["activityLogId"], response, Dao.ActivityLog);
    return res.json({
      success: true,
      message: "User updated",
      data: response,
    });
  } catch (err) {
    console.log("err", err);
    return res.json({
      success: false,
      message: err.message,
    });
  }
}

/* GET users listing. */
router.get("/", isLoggedIn, checkPermission(PERMISSIONS.OPS_USER_FULL), async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (req.query.search)
    where[Op.or] = ["firstName", "lastName"].map((key) => ({ [key]: { [Op.like]: "%" + req.query.search + "%" } }));
  const response = await User.findAndCountAll({
    distinct: true,
    include: [
      {
        model: Role,
        include: [{ model: PermissionAccess, include: [{ model: Permission }] }],
      },
      {
        model: Company,
        as: "Company",
      },
    ],
    order: [["updatedAt", "DESC"]],
    limit,
    offset,
    where,
  });
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    pages: Math.ceil(response.count / limit),
  });
});

/* GET current logged in user. */
router.get("/me", isLoggedIn, async (req, res, next) => {
  return res.json({
    success: true,
    data: req.user,
  });
});

/* GET current logged in user. */
router.put(
  "/me",
  isLoggedIn,
  async (req, res, next) => {
    req.params.id = req.userId;
    return next();
  },
  updateUser
);

/* POST user login. */
router.post("/auth/login", async (req, res, next) => {
  let loginKey = req.body.username.indexOf("@") > -1 ? "email" : "username";
  const user = await User.findOne({
    where: { [loginKey]: req.body.username },
    include: [Role],
  });
  if (!user)
    return res.status(401).json({
      success: false,
      message: "User doesn't exist with this email!",
    });
  let isPasswordValid = user.comparePassword(req.body.password);
  if (!isPasswordValid)
    return res.status(401).json({
      success: false,
      message: "Invalid password!",
    });
  if (user.Role.allowedApps.split(",").indexOf(PORTALS.OPERATIONS) < 0)
    return res.status(401).json({
      status: false,
      message: "Not allowed to enter operations portal",
    });
  var token = jwt.sign({ id: user.id }, config.JWT_SECRET, { expiresIn: "12h" });
  res.json({
    success: isPasswordValid,
    message: "Login successful",
    token,
  });
});

/* POST create new user. */
router.post("/", isLoggedIn, checkPermission(PERMISSIONS.OPS_USER_FULL), activityLog, async (req, res, next) => {
  const adminRole = await Role.findOne({ where: { type: "admin" } });
  let message = "New user registered";
  let user;
  try {
    if (req.body["companyId"] === "") req.body["companyId"] = null;
    user = await User.create({
      roleId: adminRole.id,
      ...req.body,
    });
    user.password = undefined;
  } catch (err) {
    console.log("err", err);
    return res.json({
      success: false,
      message: err.errors.pop().message,
    });
  }
  res.json({
    success: true,
    message,
    data: user,
  });
});

/* PUT update existing user. */
router.put("/:id", isLoggedIn, checkPermission(PERMISSIONS.OPS_USER_FULL), activityLog, updateUser);

router.delete("/:id", isLoggedIn, checkPermission(PERMISSIONS.OPS_USER_FULL), activityLog, async (req, res, next) => {
  let response = await User.destroy({ where: { id: req.params.id } });
  if (response)
    res.json({
      success: true,
      message: "User deleted",
    });
  else
    res.status(400).json({
      success: false,
      message: "No user found!",
    });
});

router.get("/relations", isLoggedIn, checkPermission(PERMISSIONS.OPS_USER_FULL), async (req, res, next) => {
  const roles = await Role.findAll();
  const portals = Object.keys(PORTALS_LABELS).map((portal) => ({ id: portal, label: PORTALS_LABELS[portal] }));
  let where = {};
  if (!isSuperAdmin(req)) where.contactId = req.userId;
  const customers = await Company.findAll({ where: { ...where, relationType: RELATION_TYPES.CUSTOMER } });
  res.json({
    success: true,
    message: "respond with a resource",
    roles,
    customers,
    portals,
  });
});

module.exports = router;
