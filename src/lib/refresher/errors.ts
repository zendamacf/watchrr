export class RefresherError extends Error {
  constructor() {
    super();
    if (Error.captureStackTrace) Error.captureStackTrace(this, RefresherError);
    this.name = 'RefresherError';
  }
}

export class ResourceNotFound extends RefresherError {
  constructor() {
    super();
    if (Error.captureStackTrace) Error.captureStackTrace(this, ResourceNotFound);
    this.name = 'ResourceNotFound';
  }
}
