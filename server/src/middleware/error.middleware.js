export const notFound = (req, res, next) => {
  const error = new Error(
    `Route not found: ${req.originalUrl}`
  );

  error.statusCode = 404;

  next(error);
};

/*
|--------------------------------------------------------------------------
| Centralised error handler
|--------------------------------------------------------------------------
|
| Controllers signal intent by setting `error.statusCode`. Anything without
| one is an unexpected failure: it is logged in full server-side, but the
| client gets a generic message in production so internals never leak.
*/

export const errorHandler = (
  error,
  req,
  res,
  // eslint-disable-next-line no-unused-vars
  next
) => {
  const isProduction =
    process.env.NODE_ENV === "production";

  let statusCode =
    error.statusCode ||
    (res.statusCode !== 200 ? res.statusCode : 500);

  let message =
    error.message || "Internal Server Error";

  // Deliberate, safe-to-surface errors
  let isExpected = Boolean(error.statusCode);

  // MongoDB duplicate key
  if (error.code === 11000) {
    statusCode = 409;

    const field = Object.keys(
      error.keyPattern || {}
    )[0];

    message = field
      ? `${field} already exists.`
      : "Duplicate value already exists.";

    isExpected = true;
  }

  // Mongoose validation error
  if (error.name === "ValidationError") {
    statusCode = 400;

    message = Object.values(error.errors)
      .map((err) => err.message)
      .join(", ");

    isExpected = true;
  }

  // Invalid MongoDB ObjectId
  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier.";
    isExpected = true;
  }

  if (statusCode >= 500) {
    console.error(
      `${req.method} ${req.originalUrl} ->`,
      error
    );
  }

  /*
  | Unexpected 5xx errors carry driver/SDK internals in their message, so
  | they are replaced with a generic string in production.
  */

  const body = {
    success: false,

    message:
      isProduction && !isExpected && statusCode >= 500
        ? "Internal Server Error"
        : message,
  };

  if (!isProduction && statusCode >= 500) {
    body.stack = error.stack;
  }

  res.status(statusCode).json(body);
};
