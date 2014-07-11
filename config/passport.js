var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

module.exports = function(passport) {

    passport.serializeUser(function(user, doneCallback) {
        doneCallback(null, user.id);
    });

    passport.deserializeUser(function(id, doneCallback) {
        User.findById(id, function(err, user) {
            doneCallback(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true
    },

    function(req, username, password, doneCallback) {
        console.log("Received signup request from username: " + username);
        User.findOne( { 'localUser.username' : username }, function(err, user) {
            if (err) {
                return doneCallback(err);
            }

            if (user) {
                return doneCallback(null, false, req.flash('signupMessage', 'That username is already in use'));
            } else {
                var newUser = new User();
                newUser.localUser.username = username;
                newUser.localUser.password = newUser.generateHash(password);

                newUser.save(function(err) { 
                    if (err) {
                        throw err;
                    }

                    return doneCallback(null, newUser);
                });
            }
        });
    }));
};