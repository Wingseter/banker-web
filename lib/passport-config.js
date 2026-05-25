const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/users');

module.exports = function (passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });

  passport.use('local-signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
  }, async (req, email, password, done) => {
    try {
      const user = await User.findOne(email);
      if (!user) {
        return done(null, false, req.flash('danger', 'Invalid email or password'));
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, req.flash('danger', 'Invalid email or password'));
      }
      return done(null, user, req.flash('success', 'Welcome!'));
    } catch (err) {
      return done(err);
    }
  }));
};
