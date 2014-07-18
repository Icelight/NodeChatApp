var Authentication = require('../config/auth.js');
var cookieParser = require('cookie-parser');

module.exports = function(app, passport, io, express, sessionStore) {
    var router = express.Router();
    var userSocketMap = {};
    var usernames = [];
    var sessionId

    var lastMessages = [];
    var numMessagesToSave = 5;

    var EXPRESS_SESSION_COOKIE = 'connect.sid';

    /* GET chat page */
    router.get('/',  Authentication.redirectIfNotAuthenticated, function(req, res) {
        console.log("User: " + req.session.passport.user + " has connected to the chat.");
        console.log(req.session);
        console.log(req.user);
        res.render('chat', { title: 'My Simple Chat', user: req.user });

        req.session.lastAccess = new Date().getTime();
    });

    io.set('authorization', function(data, callback) {
        console.log('Socket IO attempting to authorize user...');

        if (!data.headers.cookie) {
            console.log('No cookie sent with the socketio request');
            return callback('No cookie was sent with the socketio request', false);
        }

        //Parse the cookie with Express cookie parser
        cookieParser(data, {}, function(err) {

            console.log('Starting cookie parser...');
            if (err) {
                console.log('Could not parse cookie');
                return callback('Error while attempting to parse cookie', false);
            }

            //Get the session id cookie
            var sessionCookie = (data.secureCookies && data.secureCookies[EXPRESS_SESSION_COOKIE]) ||
                                (data.signedCookies && data.signedCookies[EXPRESS_SESSION_COOKIE]) ||
                                (data.cookies && data.cookies[EXPRESS_SESSION_COOKIE]);

            console.log('Retrieved session cookie: ' + sessionCookie);

            //Now load the session from the express session store
            sessionStore.load(sessionCookie, function(err, session) {
                if (err || !session || !session.isLogged) {
                    console.log('User is not logged in');
                    callback('User is not logged in.', false);
                } else {
                    console.log('User is logged in');
                    data.session = session;

                    callback(null, true);
                }
            });
        });

        console.log('Completed socket IO authorization');
        callback(null, true);
    });

    io.on('connection', function(socket) {
        console.log("A user has connected to socket.io");

        socket.on('disconnect', function() {
            var username = userSocketMap[socket.id];

            console.log('User ' + '"' + username + '"' + ' has disconnected from the chat');

            index = usernames.indexOf(username);

            if (index >= 0) {
                usernames.splice(index, 1);
            }

            delete userSocketMap[socket.id];

            console.log(usernames);
            console.log(userSocketMap);

            //Broadcast to all active clients that a user just left.
            socket.broadcast.emit('user-left', {'username': username});
        });

        socket.on('init', function(info) {
            if (info && info.hasOwnProperty('username')) {
                userSocketMap[socket.id] = info.username;
                usernames.push(info.username);

                //Send the welcome message and a list of all current users to the new user.
                socket.emit('message', {'user': 'system', 'message': 'Welcome to the chat!'});  
                socket.emit('userlist', usernames);

                //Send the historical list of messages if there are any
                if (lastMessages.length > 0) {
                    var messages = JSON.stringify(lastMessages);
                    socket.emit('messages', messages);
                }   

                //Send the new user to all current clients
                socket.broadcast.emit('user-joined', {'username': info.username}); 
            }
        });

        socket.on('send-message', function(message) {
            console.log('Received message: ' + message.message + ' from user: ' + message.user);

            lastMessages.push(message);

            if (lastMessages.length > numMessagesToSave) {
                lastMessages.shift();
            }

            socket.broadcast.emit('message', message);
            socket.emit('message-sent', {'success': 'true', 'message': message.message});
        });
    });

    return router;
}