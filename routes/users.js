const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User, Role, PermissionAccess, Permission } = require('../models')
const config = require('../config');
const authService = require('../services/auth.service');

/* GET users listing. */
router.get('/', authService.isLoggedIn, async (req, res, next) => {
  const users = await User.findAll({
    include: [{ model: Role, include: [{ model: PermissionAccess, include: [{ model: Permission }] }] }]
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: users
  });
});

/* POST user login. */
router.post('/auth/login', async (req, res, next) => {
  const user = await User.findOne({
    where: { email: req.body.email }
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
router.put('/', async (req, res, next) => {
  let user = await User.create(req.body);
  res.json({
    success: true,
    message: 'Created user',
    data: user
  });
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
