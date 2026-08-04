export const notFound = (req, res, next) => {
  const error = new Error(
    `Route not found: ${req.originalUrl}`
  );

  res.status(404);

  next(error);
};

export const errorHandler = (
  error,
  req,
  res,
  next
) => {
  let statusCode =
    res.statusCode !== 200
      ? res.statusCode
      : 500;

  let message =
    error.message || "Internal Server Error";

  // MongoDB duplicate key
  if (error.code === 11000) {
    statusCode = 409;

    const field = Object.keys(
      error.keyPattern || {}
    )[0];

    message = field
      ? `${field} already exists.`
      : "Duplicate value already exists.";
  }

  // Mongoose validation error
  if (error.name === "ValidationError") {
    statusCode = 400;

    message = Object.values(error.errors)
      .map((err) => err.message)
      .join(", ");
  }

  // Invalid MongoDB ObjectId
  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier.";
  }

  console.error(error);

  res.status(statusCode).json({
    success: false,
    message,
  });
};
