const LocalStrategy = require('passport-local').Strategy;
var conn = require('./database');

module.exports = function (passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    var sql = 'SELECT * FROM users WHERE id=?';
    conn.query(sql, [id], function (err, results) {
      if (err) {
        console.log(err);
        return done(err,false);
      } 
      
      if(!results[0]) {
        return done(err, false);
      }
      return done(null, results[0]);
    });
  });

  passport.use('local-signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      const sql = 'SELECT * FROM users WHERE email=? AND password=?';
      conn.query(sql, [email, password], function (err, results) {
        if (err) {
          return done('There is no user.');
        }
        if (results.length === 0) {
          return done(null, false, req.flash('danger', 'Invalid email or password'));
        } else {
          var json = JSON.stringify(results[0]);
          var user = JSON.parse(json);
          return done(null, user, req.flash('success', 'Welcome!'));
        }

      });
    } catch (err) {
      done(err);
    }
  }));
};
