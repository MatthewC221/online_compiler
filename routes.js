var express         = require("express");
var url             = require('url');
var util            = require('util');
var bodyParser      = require('body-parser');
var https           = require('https');
var path_module     = require('path');
var session         = require('express-session');

var routes = express.Router({ mergeParams: true });
var path = __dirname + '/views/';

routes.get("/", function (req, res) {
    res.render("index");
});

routes.get("/code", function (req, res) {
    res.render("code");
});

module.exports = routes;