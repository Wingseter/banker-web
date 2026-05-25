import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ValidationChain, validationResult } from 'express-validator';

/**
 * Runs the supplied validation chains, and on failure flashes the first
 * message + redirects back. Used for HTML form posts where express-validator's
 * default JSON response would be wrong.
 */
export function validateForm(chains: ValidationChain[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(chains.map((c) => c.run(req)));
    const result = validationResult(req);
    if (result.isEmpty()) {
      next();
      return;
    }
    const first = result.array()[0];
    req.flash('danger', first.msg);
    res.redirect('back');
  };
}
