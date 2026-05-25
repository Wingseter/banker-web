module.exports = (app, passport) => {
  app.get('/signin', (req, res) => {
    res.render('signin');
  });

  app.post('/signin', passport.authenticate('local-signin', {
    successRedirect: '/',
    failureRedirect: '/signin',
    failureFlash: true,
  }));

  // passport 0.7+ requires a callback for req.logout.
  app.post('/signout', (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.flash('success', 'Successfully signed out');
      res.redirect('/');
    });
  });
};
