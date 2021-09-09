const debug = require("debug")("oware-backend:server");
const limit = require("../config").rowsPerPage;
module.exports = function (req, res, next) {
  if (req.query.hasOwnProperty("page")) {
    req.query.offset = req.query.page ? req.query.page : 0;
  }
  req.offset = req.query.offset ? req.query.offset : 0;
  req.query.limit = req.query.limit ? req.query.limit : limit;
  // const lang = (req.get('LANG') || req.headers['LANG'] || 'en').toString();
  // req.setLocale(lang == 'ar' ? 'ur' : lang)
  res.sendJson = (data, msg = null, success, pages) => {
    let resObj = { success: true, message: msg, error: null, pages: pages };
    if (typeof data == "object") {
      resObj.data = data;
    } else {
      resObj.data = { app_code: data };
    }
    res.json(resObj);
  };

  res.sendError = (status = 200, message = null, errMsg) => {
    debug(`==================================================================================\n`);
    debug(`url:${req.method} ${req.originalUrl}`);
    debug(`==================================================================================\nERROR OBJECT:`);
    debug(errMsg);
    debug(`==================================================================================\n`);
    // writeLog({"scheme": req.protocol, "url": req.originalUrl, "RequestMethod": req.method, "IP": req.ip, "headers": req.headers, "body": req.body, "query": req.query, "res": res.statusCode}, msg)
    res.status(status).json({ success: false, message: message, data: null, error: errMsg });
  };
  next();
};