var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var usersRouter = require('./routes/users');
var accoutRouter = require('./routes/accounts');
var session = require('express-session');
var methodOverride = require('method-override');
var indexRouter = require('./routes/index');
var cardRouter = require('./routes/cards');
var passport = require('passport');
var flash = require('connect-flash');
var app = express();
var passportConfig = require('./lib/passport-config');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Pug의 local에 moment라이브러리와 querystring 라이브러리를 사용할 수 있도록.
moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
app.locals.moment = moment;
app.locals.querystring = require('querystring');

// _method를 통해서 method를 변경할 수 있도록 함. PUT이나 DELETE를 사용할 수 있도록.
app.use(methodOverride('_method', {methods: ['POST', 'GET']}));

app.use(flash()); // flash message를 사용할 수 있도록

// session을 사용할 수 있도록.
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'long-long-long-secret-string-1313513tefgwdsvbjkvasd'
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);

// pug의 local에 현재 사용자 정보와 flash 메시지를 전달하자.
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;  // passport는 req.user로 user정보 전달
  res.locals.flashMessages = req.flash();
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/accounts', accoutRouter);
app.use('/cards', cardRouter);
require('./routes/auth')(app, passport);

// public 디렉토리에 있는 내용은 static하게 service하도록.
app.use(express.static(path.join(__dirname, 'public')));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
