import AppError = require('./appError');

interface ErrorDetails {
  status?: number;
  code?: string;
  message?: string;
}

function errorDetails(error: unknown): ErrorDetails {
  if (error instanceof AppError) {
    return error;
  }
  return error instanceof Error ? { message: error.message } : {};
}

export = errorDetails;

