var Authentication = require('../config/auth.js');

module.exports = function(app, passport, express) {

    var router = express.Router();

    /* Get Profile */
    app.get('/profile/:user', Authentication.redirectIfNotAuthenticated, function(req, res) {
        res.render('profile', { user: req.user });
    });

    return router;
}
