module.exports = function(app, passport, express) {

    var router = express.Router();

    /* Home page */
    router.get('/', function(req, res) {
      res.render('index', { title: 'Simple Chat Gateway' });
    });

    app.get('/login', function(req, res) {
        res.render('login', { message: req.flash('loginMessage'), title: 'Log in to Simple Chat'});
    });

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/chat',
        failureRedirect: '/login',
        failureFlash: true
    }));

    app.get('/signup', function(req, res) {
        res.render('signup', { message: req.flash('signupMessage'), title: 'Sign up for Simple Chat'});
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/chat',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    return router;
}
