const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const env = require("./config/env");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const { globalLimiter } = require("./middleware/rateLimiters");
const { UPLOAD_DIR } = require("./middleware/upload");

const app = express();

if (env.trustProxy !== undefined) {
  app.set("trust proxy", env.trustProxy);
}

if (env.nodeEnv !== "test") {
  app.use(morgan(env.isProduction ? "combined" : "dev"));
}
app.use(helmet());
app.use(
  cors({
    // Only the configured frontend(s) may make credentialed requests.
    origin: (origin, callback) => {
      // Non-browser callers (curl, server-to-server) send no Origin header.
      if (!origin || env.frontendUrls.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Photos are static files; they are served before the rate limiter so a page full of
// thumbnails doesn't use up a visitor's request allowance.
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

app.use("/api", globalLimiter, routes);
app.use("/api", errorHandler.notFound);

app.use(errorHandler);

module.exports = app;
