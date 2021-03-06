const express = require('express');
const morgan = require('morgan');
var cookieParser = require('cookie-parser');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const validator = require('express-validator');
const passport = require('passport');
const flash = require('connect-flash');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
/*mod */
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
const db = require('./database');


var index = require('./routes/index');
var users = require('./routes/users');
/* /mod */


const { database } = require('./keys');

// Intializations
const app = express();
//require('./lib/passport');

// Settings
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./handlebars')
}))
app.set('view engine', '.hbs');

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    secret: 'mysqlkeysecret',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(validator());
app.use(cookieParser());


/*mod  */
app.use(function(req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

app.use('/', index);
app.use('/users', users);

/* Código para login */
passport.use('local', new LocalStrategy(
    async(username, password, done) => {
        console.log(username);
        console.log(password);
        const db = require('./database');

        await db.query('SELECT id, password FROM users WHERE username = ?', [username], function(err, results, fields) {
            if (err) { done(err) };

            if (results.length === 0) {
                done(null, false);
            } else {
                const hash = results[0].password.toString();

                bcrypt.compare(password, hash, function(err, response) {

                    if (err) return done(null, false);

                    return done(null, { user_id: results[0].id });

                });
            }
        })
    }
));
passport.serializeUser(function(user_id, done) {
    done(null, user_id);
});
passport.deserializeUser(function(user_id, done) {
    done(null, user_id);
});

/*  /Código para login */

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

/* /mod */

// Global variables

app.use((req, res, next) => {
    app.locals.message = req.flash('message');
    app.locals.success = req.flash('success');
    app.locals.user = req.user;
    next();
});


// Routes
app.use(require('./routes/index'));
app.use('/links', require('./routes/users'));

// Public
app.use(express.static(path.join(__dirname, 'public')));

// Starting
app.listen(app.get('port'), () => {
    console.log('Server is in port', app.get('port'));
});