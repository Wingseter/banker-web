import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http-error';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const isDev = req.app.get('env') === 'development';

  // CSRF rejection from csurf
  if ((err as { code?: string }).code === 'EBADCSRFTOKEN') {
    res.status(403);
    res.locals.message = 'Invalid or missing CSRF token.';
    res.locals.error = isDev ? err : {};
    res.render('error');
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status);
    res.locals.message = err.expose ? err.message : 'Server error';
    res.locals.error = isDev ? err : {};
    res.render('error');
    return;
  }

  const e = err as { status?: number; message?: string };
  res.status(e.status ?? 500);
  res.locals.message = e.message ?? 'Server error';
  res.locals.error = isDev ? err : {};
  res.render('error');
};
