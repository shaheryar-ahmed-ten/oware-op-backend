const router = express.Router();
const controller = require("./controller");
const httpStatus = require("http-status");
const config = require("../../config");

router.get("/", async (req, res) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  const params = {
    limit,
    offset
  };
  const response = await controller.getWastages(params);
  if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.status);
  else res.sendError(response.status, response.message, response.error);
});

router.post("/", async (req, res) => {
  const response = await controller.addWastages(req.body);
  if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.status);
  else res.sendError(response.status, response.message, response.code);
});
