var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet');
var csurf = require('csurf');
var session = require('express-session');
var methodOverride = require('method-override');
var passport = require('passport');
var flash = require('connect-flash');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var accoutRouter = require('./routes/accounts');
var cardRouter = require('./routes/cards');
var passportConfig = require('./lib/passport-config');

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required. Copy .env.example to .env and fill it in.');
}

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(helmet({
  // Pug templates load CSS/JS from CDNs (Bootstrap, jQuery, Font Awesome).
  // CSP would block them; leave it off until Phase 3 reworks asset loading.
  contentSecurityPolicy: false,
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Pug locals: moment for date formatting, querystring for pagination helpers.
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');
app.locals.moment = moment;
app.locals.querystring = require('querystring');

// PUT / DELETE from HTML forms. POST-only so GET links cannot bypass CSRF.
app.use(methodOverride('_method', { methods: ['POST'] }));

app.use(flash());

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
}));

app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);

// CSRF protection. Must come after session/passport so it can read req.session.
app.use(csurf());

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.flashMessages = req.flash();
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/accounts', accoutRouter);
app.use('/cards', cardRouter);
require('./routes/auth')(app, passport);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  if (err && err.code === 'EBADCSRFTOKEN') {
    res.status(403);
    res.locals.message = 'Invalid or missing CSRF token.';
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    return res.render('error');
  }

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
