const AppError = require("../utils/AppError");

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
  }

  console.error(err);
  res.status(500).json({
    error: { message: "Something went wrong", code: "INTERNAL_ERROR" },
  });
}

module.exports = errorHandler;
