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
        req.session.user = req.user;
        res.locals.sessionId = req.session.id;

        req.session.save(function(error) {

            if (error) {
                console.log("Error while saving session: ", error);
            }

            res.render('chat', { title: 'My Simple Chat', user: req.user });
        });
    });

    io.use(function(socket, callback) {

        console.log("Checking session...");

        if (socket && socket.handshake && socket.handshake.query && socket.handshake.query.sessionId) {
            var sessionId = socket.handshake.query.sessionId;

            console.log("socketio retrieving session with id: " + sessionId);

            sessionStore.get(sessionId, function(error, session) {
                socket.handshake.sessionId = sessionId;

                if (error) {
                    callback('Could not set session id with socket io authorization handshake!', false);
                } else if (!session) {
                    callback('There was no session found during socket io authorization handshake!', false);
                } 

                socket.session = session;
                callback(null, true);
            });
        } else {
            callback('No sessionId value was provided in query string to socket io connect from client', false);
        }
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

            //Broadcast to all active clients that a user just left.
            socket.broadcast.emit('user-left', {'username': username});
        });

        socket.on('init', function() {

            if (socket.session) {
                var username = socket.session.user.localUser.username;
                userSocketMap[socket.id] = username;
                usernames.push(username);

                //Send the welcome message and a list of all current users to the new user.
                socket.emit('message', {'user': 'system', 'message': 'Welcome to the chat!'});  
                socket.emit('userlist', usernames);

                //Send the historical list of messages if there are any
                if (lastMessages.length > 0) {
                    var messages = JSON.stringify(lastMessages);
                    socket.emit('messages', messages);
                }   

                //Send the new user to all current clients
                socket.broadcast.emit('user-joined', {'username': username}); 
            }
        });

        socket.on('send-message', function(message) {

            if (socket.session) {
                var username = socket.session.user.localUser.username;
                console.log('Received message: ' + message.message + ' from user: ' + username);

                lastMessages.push(message);

                if (lastMessages.length > numMessagesToSave) {
                    lastMessages.shift();
                }

                socket.broadcast.emit('message', message);
                socket.emit('message-sent', {'success': 'true', 'message': message.message});
            }
        });
    });

    return router;
}