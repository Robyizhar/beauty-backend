// import package yang diperlukan
const router = require('express').Router();
const multer = require('multer');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
// import auth/controller.js
const controller = require('./controller');


passport.use(new LocalStrategy({usernameField: 'email'}, controller.localStrategy));
// buat endpoint untuk register user baru
router.post('/register', multer().none(), controller.register);
router.post('/login', multer().none(), controller.login);
router.get('/me', controller.me);



// export router
module.exports = router;