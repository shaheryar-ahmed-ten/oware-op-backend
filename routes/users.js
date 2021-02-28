const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User, Role, PermissionAccess, Permission } = require('../models')
const config = require('../config');

/* GET users listing. */
router.get('/', async (req, res, next) => {
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
    var token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
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
router.post('/', async (req, res, next) => {
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
