import { Request, Response, NextFunction } from 'express';

export function needAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash('danger', 'Please signin first.');
  res.redirect('/signin');
}
