"use strict";

require("dotenv").config();
const express = require("express");
const path = require('path');
const cookieParser = require("cookie-parser");
const logger = require('morgan');
const line = require("@line/bot-sdk");
const session = require("express-session");
const passport = require('passport');
const helmet = require('helmet');

const lineRouter = require('./routes/line');
const usersRouter = require('./routes/users');
const indexRouter = require('./routes/index');

const app = express();

app.use('/line/callback', line.middleware({
  channelSecret: process.env.CHANNEL_SECRET,
}), lineRouter);

app.use(helmet(
  {
    contentSecurityPolicy: {
      directives: {
        "default-src": ["*"],
        "img-src": ["*", "self", "data:", "https:"],
        "script-src": ["self", "unsafe-inline", "unsafe-eval", "*"],
        "style-src": ["self", "unsafe-inline", "*"],
      }
    }
  }
));

require('./auth');

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.get('/login/line', passport.authenticate('line'));
app.get('/login/line/return',
  passport.authenticate('line', { failureRedirect: '/' }),
  function (req, res) {
    res.redirect('/');
  });

module.exports = app