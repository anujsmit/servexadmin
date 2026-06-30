// _lib/errors.ts

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(response: Response, data?: any): ApiError {
    const message = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
    return new ApiError(message, response.status, data?.code, data?.details);
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection error. Please check your internet connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed. Please login again.') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}