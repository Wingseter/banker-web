import bcrypt from 'bcrypt';
import { PassportStatic } from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import * as Users from '../models/users';

export function configurePassport(passport: PassportStatic): void {
  passport.serializeUser<number>((user, done) => {
    done(null, (user as { id: number }).id);
  });

  passport.deserializeUser<number>(async (id, done) => {
    try {
      const user = await Users.findById(id);
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  });

  passport.use(
    'local-signin',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        try {
          const user = await Users.findByEmail(email);
          if (!user) {
            return done(null, false, req.flash('danger', 'Invalid email or password') as never);
          }
          const ok = await bcrypt.compare(password, user.password);
          if (!ok) {
            return done(null, false, req.flash('danger', 'Invalid email or password') as never);
          }
          return done(null, user, req.flash('success', 'Welcome!') as never);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
}
