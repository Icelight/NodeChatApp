var express = require('express'),
    http = require('http');

var port = process.env.PORT || 3000;

var app = express();
var server = app.listen(port);
var io = require('socket.io').listen(server);

var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var chat = require('./routes/chat');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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

io.on('connection', function(socket) {
    console.log("A user has connected to socket.io");

    socket.on('disconnect', function() {
        console.log('A user has disconnected from socket.io');
    });

    socket.on('init', function() {
        socket.emit('message', {'user': 'system', 'message': 'Welcome to the chat!'});
    });

    socket.on('message', function(message) {
        console.log('Received message: ' + message.message + ' from user: ' + message.user);

        io.sockets.emit('message', message);
    });
});


module.exports = app;
