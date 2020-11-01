const LocalStrategy = require('passport-local').Strategy;
const bkfd2Password = require("pbkdf2-password");
var hasher = bkfd2Password();

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
      const sql = 'SELECT * FROM users WHERE authId=?';
      conn.query(sql, ['local:' + username], function (err, results) {
        if (err) {
          return done('There is no user.');
        }
        var user = results[0];
        console.log(user);
        hasher({password:password, salt:user.salt}, (err, pass, salt, hash) =>{
          if(hash === user.password){
            console.log('LocalStrategy', user);
            return done(null, user, req.flash('success', 'Welcome!'));
          } else {
            return done(null, false, req.flash('danger', 'Invalid email or password'));
          }
        });
      });
    } catch (err) {
      done(err);
    }
  }));
};
