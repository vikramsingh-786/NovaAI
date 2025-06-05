export class APIError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, APIError.prototype);
  }

  toJSON() {
    return {
      error: this.message,
      status: this.status,
      ...(this.details && { details: this.details }),
    };
  }
}

export function handleError(error: unknown) {
  if (error instanceof APIError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new APIError(error.message);
  }
  
  return new APIError('An unknown error occurred');
}