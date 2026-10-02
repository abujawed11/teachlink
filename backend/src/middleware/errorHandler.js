const AppError = require("../utils/AppError");

// Requests to an /api path that no route handled: answer in JSON like everything else.
function notFound(req, res) {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl.split("?")[0]}`, code: "NOT_FOUND" },
  });
}

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
  }

  // Client mistakes raised by Express/body-parser (malformed JSON, body too large...) carry a 4xx
  // status. They are the caller's fault, not a server failure, so don't log them as 500s.
  const status = err.status || err.statusCode;
  if (status >= 400 && status < 500 && err.expose) {
    const messages = {
      "entity.parse.failed": "The request body is not valid JSON",
      "entity.too.large": "The request body is too large",
    };
    return res.status(status).json({
      error: { message: messages[err.type] || "Bad request", code: "BAD_REQUEST" },
    });
  }

  console.error(err);
  res.status(500).json({
    error: { message: "Something went wrong", code: "INTERNAL_ERROR" },
  });
}

module.exports = errorHandler;
module.exports.notFound = notFound;
