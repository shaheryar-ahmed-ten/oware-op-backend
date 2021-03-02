const { User, Role, PermissionAccess, Permission } = require('../models')
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports.isLoggedIn = (req, res, next) => {
    let token = req.headers['authorization'];
    token = token && token.replace('Bearer ', '');
    if (!token) return res.status(401).send({ success: false, message: 'No token provided.' });
    jwt.verify(token, config.JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(500).send({ success: false, message: 'Failed to authenticate token.' });
        req.userId = decoded.id;
        req.user = await User.findOne({
            where: { id: req.userId },
            include: [{ model: Role, include: [{ model: PermissionAccess, include: [{ model: Permission }] }] }],
            raw: true
        });
        return next();
    });
}

module.exports.isSuperAdmin = (req, res, next) => {
    console.log('isSuperAdmin', req.user['Role.PermissionAccesses.Permission.type'])
    if (req.user['Role.PermissionAccesses.Permission.type'] === 'superadmin_privileges') next();
    else res.status(401).send({ status: false, message: 'Operation not permitted!' })
}

