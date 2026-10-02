const AppError = require("../utils/AppError");

function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(", ");
      return next(new AppError(message, 400, "VALIDATION_ERROR"));
    }
    if (source === "query") {
      // Express 5 exposes req.query as a getter-only property, so assigning to it throws.
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
      });
    } else {
      req[source] = result.data;
    }
    next();
  };
}

module.exports = validate;
