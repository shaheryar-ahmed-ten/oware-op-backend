const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User, Role, PermissionAccess, Permission, Company } = require('../models')
const config = require('../config');
const { isLoggedIn, checkPermission, isSuperAdmin } = require('../services/auth.service');
const { Op } = require("sequelize");
const { PERMISSIONS, PORTALS } = require('../enums');
const PORTALS_LABELS = require('../enums/portals');

async function updateUser(req, res, next) {
  let user = await User.findOne({ where: { id: req.params.id } });
  if (!user) return res.status(400).json({
    success: false,
    message: 'No user found!'
  });
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.roleId = req.body.roleId;
  user.phone = req.body.phone;
  user.companyId = req.body.companyId;
  if (req.body.password) user.password = req.body.password;
  user.isActive = req.body.isActive;
  try {
    const response = await user.save();
    return res.json({
      success: true,
      message: 'User updated',
      data: response
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message
    });
  }
}

/* GET users listing. */
router.get('/', isLoggedIn, checkPermission(PERMISSIONS.OPS_USER_FULL), async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (req.query.search) where[Op.or] = ['firstName', 'lastName'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await User.findAndCountAll({
    distinct: true,
    include: [{
      model: Role,
      include: [{ model: PermissionAccess, include: [{ model: Permission }] }]
    }, {
      model: Company,
      as: 'Company'
    }],
    orderBy: [['updatedAt', 'DESC']],
    limit, offset, where
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: response.rows,
    pages: Math.ceil(response.count / limit)
  });
});

/* GET current logged in user. */
router.get('/me', isLoggedIn, async (req, res, next) => {
  return res.json({
    success: true,
    data: req.user
  })
});

/* GET current logged in user. */
router.put('/me', isLoggedIn, async (req, res, next) => {
  req.params.id = req.userId;
  return next()
}, updateUser);

/* POST user login. */
router.post('/auth/login', async (req, res, next) => {
  let loginKey = req.body.username.indexOf('@') > -1 ? 'email' : 'username';
  const user = await User.findOne({
    where: { [loginKey]: req.body.username },
    include: [Role]
  });
  if (!user)
    return res.status(401).json({
      success: false,
      message: 'User doesn\'t exist with this email!'
    });
  let isPasswordValid = user.comparePassword(req.body.password);
  if (!isPasswordValid) return res.status(401).json({
    success: false,
    message: 'Invalid password!'
  });
  if (user.Role.allowedApps.split(',').indexOf(PORTALS.OPERATIONS) < 0)
    return res.status(401).json({
      status: false,
      message: 'Not allowed to enter operations portal'
    });
  var token = jwt.sign({ id: user.id }, config.JWT_SECRET);
  res.json({
    success: isPasswordValid,
    message: 'Login successful',
    token
  });
});

/* POST create new user. */
router.post('/', isLoggedIn, checkPermission(PERMISSIONS.OPS_USER_FULL), async (req, res, next) => {
  const adminRole = await Role.findOne({ where: { type: 'admin' } });
  let message = 'New user registered';
  let user;
  try {
    user = await User.create({
      roleId: adminRole.id,
      ...req.body
    });
    user.password = undefined;
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message
    });
  }
  res.json({
    success: true,
    message,
    data: user
  });
});

/* PUT update existing user. */
router.put('/:id', isLoggedIn, checkPermission(PERMISSIONS.OPS_USER_FULL), updateUser);

router.delete('/:id', isLoggedIn, checkPermission(PERMISSIONS.OPS_USER_FULL), async (req, res, next) => {
  let response = await User.destroy({ where: { id: req.params.id } });
  if (response) res.json({
    success: true,
    message: 'User deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No user found!'
  });
})


router.get('/relations', isLoggedIn, checkPermission(PERMISSIONS.OPS_USER_FULL), async (req, res, next) => {
  const roles = await Role.findAll();
  const portals = Object.keys(PORTALS_LABELS).map(portal => ({ id: portal, label: PORTALS_LABELS[portal] }));
  let where = {};
  if (!isSuperAdmin(req)) where.contactId = req.userId;
  const customers = await Company.findAll({ where });
  res.json({
    success: true,
    message: 'respond with a resource',
    roles, customers, portals
  });
});

module.exports = router;
