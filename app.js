var express  = require('express');
var app      = express();
// process.env.PORT = 3001;
var port     = process.env.PORT || 3000;
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var requestIp = require("request-ip");
var routes = require('./routes/index');
var db = mongoose.connection;
var favicon = require("serve-favicon");
var CronJob = require('cron').CronJob;


mongoose.connect('mongodb://localhost:27017/se_db_single');
db.on('error', console.error.bind(console, 'connection error:'));
db.openUri("mongodb://localhost:27017/se_db_single",function() {
    console.log("Server Listening : "+port);
    console.log("connected to se_db_single");
});



// routes ======================================================================

// view engine setup
app.set('views', path.join(__dirname, 'client/views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname + '/client/favicon/', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/", express.static(__dirname + '/client'));
app.use("/logs/", express.static('logs'));
app.use("/", express.static(__dirname + '/client/views'));
app.use(requestIp.mw());
// hexaks routes
//catch 404 and forward to error handler
app.use('error404',function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use('/*',function(req,res,next){

    next();
});

app.use('/',routes);
app.all('/*', function(req, res, next) {
    // CORS headers
    res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    // Set custom headers for CORS
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
    if (req.method === 'OPTIONS' || req.method === 'DELETE') {
        res.status(200).end();
    } else {
        next();
    }
});

// error handler










module.exports = app;