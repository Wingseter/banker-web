const LocalStrategy = require('passport-local').Strategy;


module.exports = function (passport, conn) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    var sql = 'SELECT * FROM users WHERE authId=?';
    conn.query(sql, [id], function (err, results) {
      if (err) {
        console.log(err);
        done('There is no user.');
      } else {
        done(null, results[0]);
      }
    });
  });

  passport.use('local-signin', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, username, password, done) => {
    try {
      const sql = 'SELECT * FROM users WHERE authId=? AND password=?';
      conn.query(sql, ['local:' + username], function (err, result) {
        if (err) {
          return done('There is no user.');
        }
        if (result.length === 0) {
          return done(null, false, req.flash('danger', 'Invalid email or password'));
        } else {
          var json = JSON.stringify(result[0]);
          var user = JSON.parse(json);
          return done(null, user, req.flash('success', 'Welcome!'));
        }

      });
    } catch (err) {
      done(err);
    }
  }));
};
