import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { config } from "../config/config.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of ApiError, create a new one
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error.errors || [], error.stack);
  }

  // Prepare the response
  const response = new ApiResponse(error.statusCode, null, error.message);

  // In development, send the error stack trace
  if (config.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  // Send the error response
  res.status(error.statusCode).json(response);
};

export { errorHandler };
