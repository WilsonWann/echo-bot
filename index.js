"use strict";

require("dotenv").config();
const line = require("@line/bot-sdk");
const express = require("express");
const path = require('path');
const session = require("express-session");
const cookieParser = require("cookie-parser");
const helmet = require('helmet');
const passport = require('passport');
const logger = require('morgan');

const lineRouter = require('./routes/line');
const usersRouter = require('./routes/users');
const indexRouter = require('./routes/index');


const accessToken = process.env.CHANNEL_ACCESS_TOKEN;
// create LINE SDK config from env variables
const config = {
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: accessToken,
});
const blobClient = new line.messagingApi.MessagingApiBlobClient({
  channelAccessToken: accessToken,
});

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

app.use('/line/callback', line.middleware(config), lineRouter);

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
// register a webhook handler with middleware
// about the middleware, please refer to doc

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
