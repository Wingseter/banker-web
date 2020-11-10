const LocalStrategy = require('passport-local').Strategy;
var DB = require('./database');

module.exports = function (passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    var sql = 'SELECT * FROM users WHERE id=?';
    DB('GET', sql, [id]).then(function (res) {
      if(!res.row) {
        return done(err, false);
      }
      return done(null, res.row[0]);
    });
  });

  passport.use('local-signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      const sql = 'SELECT * FROM users WHERE email=? AND password=?';
      DB('GET', sql, [email, password]).then(function (res) {
        if (res.length === 0) {
          return done(null, false, req.flash('danger', 'Invalid email or password'));
        } else {
          var user = res.row[0];
          return done(null, user, req.flash('success', 'Welcome!'));
        }

      });
    } catch (err) {
      done(err);
    }
  }));
};
