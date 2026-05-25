import path from 'path';
import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import csurf from 'csurf';
import session from 'express-session';
import methodOverride from 'method-override';
import passport from 'passport';
import flash from 'connect-flash';
import moment from 'moment';
import 'moment-timezone';
import querystring from 'querystring';

import indexRouter from './routes/index';
import usersRouter from './routes/users';
import accountsRouter from './routes/accounts';
import cardsRouter from './routes/cards';
import healthRouter from './routes/health';
import { registerAuthRoutes } from './routes/auth';
import { configurePassport } from './lib/passport';
import { errorHandler } from './middlewares/error-handler';

import './types/domain';

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required. Copy .env.example to .env and fill it in.');
}

const app = express();

const projectRoot = path.resolve(__dirname, '..');
app.set('views', path.join(projectRoot, 'views'));
app.set('view engine', 'pug');

app.use(
  helmet({
    // Pug templates load Bootstrap/jQuery/Font Awesome from public CDNs;
    // CSP would block them until Phase 3 reworks asset loading.
    contentSecurityPolicy: false,
  }),
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(projectRoot, 'public')));

// /healthz must NOT be behind session/csrf — Docker healthcheck cannot
// negotiate cookies. Mount before passport/csurf middleware so it's a
// plain JSON probe.
app.use('/', healthRouter);

moment.tz.setDefault('Asia/Seoul');
app.locals.moment = moment;
app.locals.querystring = querystring;

// PUT/DELETE from HTML forms. POST-only so GET links cannot bypass CSRF.
app.use(methodOverride('_method', { methods: ['POST'] }));

app.use(flash());

app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);

// CSRF must come after session/passport so it can read req.session.
// @types/csurf and our @types/express disagree on the RequestHandler shape;
// the value is fine at runtime, so cast through unknown.
app.use(csurf() as unknown as RequestHandler);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.currentUser = req.user;
  res.locals.flashMessages = req.flash();
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/accounts', accountsRouter);
app.use('/cards', cardsRouter);
registerAuthRoutes(app, passport);

app.use((_req, _res, next) => {
  next(createError(404));
});

app.use(errorHandler);

export default app;
