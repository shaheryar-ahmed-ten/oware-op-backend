const { User, Role, PermissionAccess, Permission } = require("../models");
const jwt = require("jsonwebtoken");
const config = require("../config");
const { ROLES, PORTALS } = require("../enums");

module.exports.isLoggedIn = (req, res, next) => {
  let token = req.headers["authorization"];
  token = token && token.replace("Bearer ", "");
  if (!token) return res.status(401).json({ success: false, message: "No token provided." });
  jwt.verify(token, config.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: "Failed to authenticate token." });
    const user = await User.findOne({
      where: { id: decoded.id },
      include: [
        {
          model: Role,
          include: [{ model: PermissionAccess, include: [{ model: Permission }] }],
        },
      ],
    });
    if (!user) return res.status(401).json({ status: false, message: "User doesn't exist" });
    if (!user.isActive) return res.status(401).json({ status: false, message: "User is inactive" });
    if (user.Role.allowedApps.split(",").indexOf(PORTALS.OPERATIONS) < 0)
      return res.status(401).json({ status: false, message: "Not allowed to enter operations portal" });
    req.userId = decoded.id;
    user.password = undefined;
    req.user = user;
    return next();
  });
};

module.exports.isSuperAdmin = (req, res, next) => {
  if (req.user.Role.type == ROLES.SUPER_ADMIN)
    if (next) next();
    else return true;
  else if (next) res.status(401).json({ status: false, message: "Operation not permitted!" });
  else return false;
};

module.exports.checkPermission = (permission) => (req, res, next) => {
  if (req.user.Role.PermissionAccesses.find((permissionAccess) => permissionAccess.Permission.type == permission))
    if (next) next();
    else return true;
  else if (next) res.status(401).json({ status: false, message: "Operation not permitted!" });
  else return false;
};
