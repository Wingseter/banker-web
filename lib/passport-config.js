const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/users')

module.exports = function (passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    var user = await User.findById(id);
   
    if(user.length === 0) {
      return done(err, false);
    }
    return done(null, user);
  });

  passport.use('local-signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      var user = await User.findLogin(email, password);
      if (!user) {
        return done(null, false, req.flash('danger', 'Invalid email or password'));
      } else {
        return done(null, user, req.flash('success', 'Welcome!'));
      }
    } catch (err) {
      done(err);
    }
  }));
};
