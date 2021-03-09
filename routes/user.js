const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User, Role, PermissionAccess, Permission } = require('../models')
const config = require('../config');
const authService = require('../services/auth.service');
const { Op } = require("sequelize");

/* GET users listing. */
router.get('/', authService.isLoggedIn, authService.isSuperAdmin, async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (req.query.search) where[Op.or] = ['firstName', 'lastName'].map(key => ({ [key]: { [Op.like]: '%' + req.body.search + '%' } }));
  const response = await User.findAndCountAll({
    include: [{ model: Role, include: [{ model: PermissionAccess, include: [{ model: Permission }] }] }],
    orderBy: [['createdAt', 'DESC']],
    limit, offset, where, raw: true
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: response.rows,
    pages: Math.ceil(response.count / limit)
  });
});

router.get('/me', authService.isLoggedIn, async (req, res, next) => {
  return res.json({
    success: true,
    data: req.user
  })
});
/* POST user login. */
router.post('/auth/login', async (req, res, next) => {
  let loginKey = req.body.username.indexOf('@') > -1 ? 'email' : 'username';
  const user = await User.findOne({
    where: { [loginKey]: req.body.username }
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
  var token = jwt.sign({ id: user.id }, config.JWT_SECRET, {
    expiresIn: 86400 // expires in 24 hours
  });
  res.json({
    success: isPasswordValid,
    message: 'Login successful',
    token
  });
});

/* POST create new user. */
router.post('/', authService.isLoggedIn, authService.isSuperAdmin, async (req, res, next) => {
  let adminRole = await Role.findOne({ where: { type: 'admin' } });
  let message = 'New user registered';
  let user;
  try {
    user = await User.create({
      roleId: adminRole.id,
      ...req.body
    });
    delete user.password;
  } catch (err) {
    message = err.errors.pop().message;
  }
  res.json({
    success: true,
    message,
    data: user
  });
});

/* PUT update existing user. */
router.put('/:id', authService.isLoggedIn, authService.isSuperAdmin, async (req, res, next) => {
  let user = await User.findOne({ where: { id: req.params.id } });
  if (user) {
    res.json({
      success: true,
      message: 'User updated',
      data: user
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'No user found!'
    })
  }
});

router.get('/roles', async (req, res, next) => {
  const users = await Role.findAll({
    include: [{ model: PermissionAccess, include: [{ model: Permission }] }]
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: users
  });
});

module.exports = router;
