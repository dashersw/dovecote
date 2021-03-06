var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var expressSession = require('express-session');
var FileStore = require('session-file-store')(expressSession);

require('dovecote/lib/mongo');
var User = require('dovecote/components/user/model');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function(email, password, done) {
        User
            .findOne({email})
            .then((user) => {
                if (!user || !user.checkPassword(password)) {
                    return done(new Error('Incorrect email or password'));
                }

                done(null, user);
            })
            .catch(done);
    }
));

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User
        .findOne({_id: id})
        .then(user => done(null, user))
        .catch(done);
});

app.use(expressSession({
    store: new FileStore({ path: '../preserved/sessions', ttl: 24 * 3600 }),
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET || 'myRandomAndSecretKey'
}));
app.use(passport.initialize());
app.use(passport.session());

// app.use(express.static(path.join(__dirname, 'frontend/dist')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(require('dovecote/routers'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(require('dovecote/lib/middlewares/error'));

module.exports = app;
