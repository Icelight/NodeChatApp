module.exports = function(app, passport) {

    var express = require('express');
    var router = express.Router();

    /* Get Profile */
    app.get('/profile/:user', isLoggedIn, function(req, res) {
        res.render('profile', { user: req.params.user });
    });

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }

        res.redirect('/');
    }

    return router;

}
