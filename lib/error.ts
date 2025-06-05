// type ErrorDetails = Record<string, unknown> | unknown[] | string | number | boolean | null;

// export class APIError extends Error {
//   status: number;
//   details?: ErrorDetails;

//   constructor(
//     message: string,
//     status: number = 500,
//     details?: ErrorDetails
//   ) {
//     super(message);
//     this.status = status;
//     this.details = details;
//     Object.setPrototypeOf(this, APIError.prototype);
//   }

//   toJSON(): {
//     error: string;
//     status: number;
//     details?: ErrorDetails;
//   } {
//     const json: {
//       error: string;
//       status: number;
//       details?: ErrorDetails;
//     } = {
//       error: this.message,
//       status: this.status,
//     };

//     if (this.details !== undefined && this.details !== null) {
//       json.details = this.details;
//     }

//     return json;
//   }
// }

// export function handleError(error: unknown): APIError {
//   if (error instanceof APIError) {
//     return error;
//   }
  
//   if (error instanceof Error) {
//     return new APIError(error.message);
//   }
  
//   return new APIError('An unknown error occurred');
// }