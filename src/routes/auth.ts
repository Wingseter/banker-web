import { Express, NextFunction, Request, Response } from 'express';
import { PassportStatic } from 'passport';

export function registerAuthRoutes(app: Express, passport: PassportStatic): void {
  app.get('/signin', (_req: Request, res: Response) => {
    res.render('signin');
  });

  app.post(
    '/signin',
    passport.authenticate('local-signin', {
      successRedirect: '/',
      failureRedirect: '/signin',
      failureFlash: true,
    }),
  );

  // passport 0.7+: req.logout requires a callback.
  app.post('/signout', (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      req.flash('success', 'Successfully signed out');
      res.redirect('/');
    });
  });
}
