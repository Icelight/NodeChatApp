var express = require('express'),
    http = require('http');

var port = process.env.PORT || 3000;

var path = require('path');
var passport = require('passport');
var favicon = require('static-favicon');

var mongoose = require('mongoose');
var flash = require('connect-flash');

var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);

var app = express();
var server = app.listen(port);

var socketHandshake = require('socket.io-handshake');

var io = require('socket.io').listen(server);

// -- Configuration --

var configDB = require('./config/database.js');
mongoose.connect(configDB.url);

//The following is required for passport
app.use(flash());
app.use(cookieParser());
app.use(bodyParser());

var sessionStore = new RedisStore({host:'localhost', port: 6379, prefix: 'chat-session'});

app.use(session({
    store: sessionStore,
    secret: 'thisismysupersecret',
    clear_interval: 900,
    cookie: {maxAge: 1000 * 60 * 60 * 720, httpOnly: true, secure: true},
    rolling: true
}));

app.use(passport.initialize());
app.use(passport.session()); 

require('./config/passport')(passport);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));

var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

var routes = require('./routes/index')(app, passport, express);
var users = require('./routes/users')(app, passport, express);
var chat = require('./routes/chat')(app, passport, io, express, sessionStore);

app.use('/', routes);
app.use('/users', users);
app.use('/chat', chat);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
