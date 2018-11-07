var express         = require("express");
var url             = require('url');
var util            = require('util');
var bodyParser      = require('body-parser');
var https           = require('https');
var path_module     = require('path');
var session         = require('express-session');
var shell           = require('shelljs');

var routes = express.Router({ mergeParams: true });
var path = __dirname + '/views/';

routes.get("/", function (req, res) {
    res.render("index");
});

routes.get("/code", function (req, res) {
    res.render("code");
});

routes.post("/run", function (req, res) {
    // Will only run once
    var stringCode;
    for (var key in req.body) {
        stringCode = key;
    }
    console.log(stringCode);
    var exec = require('child_process').exec, child;

    // const shell = require('shelljs');
     //shell.exec(comandToExecute, {silent:true}).stdout;
     //you need little improvisation
     shell.exec('dir')
});

module.exports = routes;