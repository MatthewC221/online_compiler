var express         = require("express");
var url             = require('url');
var util            = require('util');
var bodyParser      = require('body-parser');
var https           = require('https');
var path_module     = require('path');
var session         = require('express-session');
var shell           = require('shelljs');
var fs              = require('fs');
 var exec           = require('child_process').exec, child;

var routes = express.Router({ mergeParams: true });
var path = __dirname + '/views/';

routes.get("/", function (req, res) {
    res.render("index");
});

routes.get("/code", function (req, res) {
    res.render("code");
});

routes.post("/run", function (req, res) {
    fs.writeFile("./exe/main.py", req.body.code, function(err) {
        if (err) {
            return console.log(err);
        }
        exec('python "./exe/runner.py"', function (code, stdout, stderr) {
            var response = {
                status: 200,
                success: "Code output success",
                contents: stderr.length ? stderr : stdout // stderr takes priority
            }
            res.end(JSON.stringify(response));
        });
    });
});

module.exports = routes;