module.exports = function(app, passport) {

    var express = require('express');
    var router = express.Router();

    /* Home page */
    router.get('/', function(req, res) {
      res.render('index', { title: 'Simple Chat Gateway' });
    });

    app.get('/login', function(req, res) {
        res.render('login', { message: req.flash('loginMessage'), title: 'Log in to Simple Chat'});
    });

    app.post('/login', function(req, res) {

    });

    app.get('/signup', function(req, res) {
        res.render('signup', { message: req.flash('signupMessage'), title: 'Sign up for Simple Chat'});
    });

    app.post('/signup', function(req, res) {

    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    return router;
}
