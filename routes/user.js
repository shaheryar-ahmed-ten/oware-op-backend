const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User, Role, PermissionAccess, Permission } = require('../models')
const config = require('../config');
const authService = require('../services/auth.service');
const { Op } = require("sequelize");

/* GET users listing. */
router.get('/', authService.isLoggedIn, authService.isSuperAdmin, async (req, res, next) => {
  const limit = req.body.rowsPerPage || config.rowsPerPage
  const offset = (req.body.page || 0) * limit;
  let where = {};
  if (req.body.search) where[Op.or] = ['firstName', 'lastName'].map(key => ({ [key]: { [Op.like]: '%' + req.body.search + '%' } }));
  const users = await User.findAll({
    include: [{ model: Role, include: [{ model: PermissionAccess, include: [{ model: Permission }] }] }],
    orderBy: [['createdAt', 'DESC']],
    limit, offset, where, raw: true
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: users
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
  if (isPasswordValid) {
    var token = jwt.sign({ id: user.id }, config.JWT_SECRET, {
      expiresIn: 86400 // expires in 24 hours
    });
    res.json({
      success: isPasswordValid,
      message: 'Login successful',
      token
    });
  } else res.status(401).json({
    success: false,
    message: 'Invalid password!'
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
