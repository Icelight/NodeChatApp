var Authentication = require('../config/auth.js');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

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
                socket.sessionId = sessionId;

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

            //Remove the user from the list if they have no open connections for their session.
            //Otherwise just decrement the number of active connections for that session and call it a day!
            if (socket.sessionId in userSocketMap) {
                var userInfo = userSocketMap[socket.sessionId];

                userSocketMap[socket.sessionId].active--;

                if (userSocketMap[socket.sessionId].active <= 0) {
                    console.log('User ' + '"' + userInfo.username + '"' + ' has disconnected from the chat');
                    
                    index = usernames.indexOf(userInfo.username);

                    if (index >= 0) {
                        usernames.splice(index, 1);
                    }

                    delete userSocketMap[socket.sessionId];

                    //Broadcast to all active clients that a user just left.
                    socket.broadcast.emit('user-left', {'username': userInfo.username});
                }
            }
        });

        socket.on('join', function() {

            var alreadyJoined = false;

            if (socket.sessionId in userSocketMap) {
                console.log("User with session " + socket.sessionId + " has already joined.");
                alreadyJoined = true;
            }

            if (socket.session) {

                var username = socket.session.user.localUser.username;

                //If the user has already joined we don't want to send out a message
                //saying that a new user has joined, nor do we want to add them
                //to the user list. 
                if (!alreadyJoined) {
                    userSocketMap[socket.sessionId] = {'username': username, 'active': 1};
                    usernames.push(username);

                    socket.broadcast.emit('user-joined', {'username': username}); 
                } else {
                    userSocketMap[socket.sessionId].active++;
                }

                socket.username = username;

                //Send the welcome message and a list of all current users to the new user.
                socket.emit('message', {'user': 'system', 'message': 'Welcome to the chat!'});  
                socket.emit('userlist', usernames);

                //Send the historical list of messages if there are any
                if (lastMessages.length > 0) {
                    var messages = JSON.stringify(lastMessages);
                    socket.emit('messages', messages);
                }   
            }
        });

        socket.on('send-message', function(message) {

            sessionStore.get(socket.sessionId, function(error, session) {

                if (error || !session) {
                    console.log("Error:", error);
                    socket.emit('message-sent', {'success': false, 'error': 'session-expired'});
                } else {
                    console.log('Received message: ' + message.message + ' from user: ' + socket.username);
                    message.user = socket.username;

                    lastMessages.push(message);

                    if (lastMessages.length > numMessagesToSave) {
                        lastMessages.shift();
                    }

                    io.sockets.emit('message', message);
                    socket.emit('message-sent', {'success': true, 'message': message.message});
                }
            });
        });
    });

    return router;
}