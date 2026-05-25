export class HttpError extends Error {
  readonly status: number;
  readonly expose: boolean;

  constructor(status: number, message: string, options?: { expose?: boolean }) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.expose = options?.expose ?? status < 500;
  }
}

export class BadRequest extends HttpError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

export class Unauthorized extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class Forbidden extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFound extends HttpError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

export class UnprocessableEntity extends HttpError {
  constructor(message = 'Unprocessable Entity') {
    super(422, message);
  }
}
