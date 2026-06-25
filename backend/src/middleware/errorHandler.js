// Global error handling middleware
// Catches any unhandled errors and returns a safe response

const errorHandler = (err, req, res, next) => {
  // Log the error for debugging (server-side only)
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Don't leak stack traces or internal details to the client
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong. Please try again later."
      : err.message || "Internal server error";

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

export default errorHandler;
