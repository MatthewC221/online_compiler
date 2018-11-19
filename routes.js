var express         = require("express");
var url             = require('url');
var util            = require('util');
var bodyParser      = require('body-parser');
var https           = require('https');
var session         = require('express-session');
var shell           = require('shelljs');
var fs              = require('fs');
var exec            = require('child_process').exec, child;

var routes = express.Router({ mergeParams: true });
var MAX_LINES = 100;
var OUTPUT_EXCEEDED_WARNING = "+ WARNING: Output limit exceeded";

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
        var command = "python runner.py " + req.body.args;
        exec(command, function (code, stdout, stderr) {
            var outputType;
            var contents;
            if (stderr.length) {
                outputType = "stderr";
                contents = stderr;
            } else {
                outputType = "stdout"
                var lines = stdout.split(/\r\n|\r|\n/);
                var lengthLines = lines.length;
                if (lengthLines > MAX_LINES) {
                    lines = lines.slice(0, MAX_LINES);
                    lines.push(OUTPUT_EXCEEDED_WARNING);
                    contents = lines.join("\n");
                } else {
                    contents = stdout;
                }
            }
            var response = {
                status: 200,
                success: "Code output success",
                outputType: outputType,
                contents: contents // stderr takes priority
            }
            res.end(JSON.stringify(response));
        });
    });
});

module.exports = routes;