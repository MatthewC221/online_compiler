'use strict';
var url             = require('url');
var bodyParser      = require('body-parser');
var https           = require('https');
var session         = require('client-sessions');
var shell           = require('shelljs');
var fs              = require('fs');
var exec            = require('child_process').exec, child;
var database        = require('./util/database.js');

var OUTPUT_EXCEEDED_WARNING = "+ WARNING: Output limit exceeded";
var MAX_LINES               = 100;

var HAS_SPECIAL_CHAR_REGEX = /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
var ALPHANUMERIC_REGEX     = /^[a-z0-9]+$/i;
var HAS_DIGIT_REGEX        = /\d/;

var INVALID_USERNAME = 
    "Invalid username, refer to username rules (mouseover username field)";
var EXISTING_USERNAME   = "Username already exists";
var EXISTING_EMAIL      = "Email is registered already";
var PASSWORDS_NOT_EQUAL = "Passwords not equal";
var INVALID_PASSWORD    = "Invalid password, refer to password rules (mouseover password field)";

var errHandler = function (err) {
    console.log(err);
}

module.exports = (function(app) {
    app.use(session({
        cookieName: 'session',
        secret: 'secretSessionType',
        duration: 30 * 60 * 1000,
        activeDuration: 5 * 60 * 1000
    }));

    app.use("/", function (req, res, next) {
        if (req.session && req.session.user) {
            req.user = req.session.user;
            delete req.user.password;
        }
        next();
    });

    app.get("/", function (req, res) {
        res.render("index", { user: req.user });
    });

    app.get("/code", function (req, res) {
        res.render("code", { 
            user: req.user,
        });
    });

    app.get("/logout", function (req, res) {
        req.session.reset();
        res.redirect("/");
    });

    app.get("/register", function (req, res) {
        res.render("register", { status: null });
    });

    app.post("/register", function (req, res) {
        var registerStatus    = "";
        var username          = req.body.username;
        var email             = req.body.email;
        var password          = req.body.password;
        var confirmPassword   = req.body.confirmPassword;

        if (!HAS_DIGIT_REGEX.test(password) || 
            !HAS_SPECIAL_CHAR_REGEX.test(password) || 
            password.length < 8 || 
            password.length > 25) {
            registerStatus = INVALID_PASSWORD;
        }    
        if (password !== confirmPassword) {
            registerStatus = PASSWORDS_NOT_EQUAL;
        }
        if (!ALPHANUMERIC_REGEX.test(username) || username.length < 5 || 
            username.length > 15) {
            registerStatus = INVALID_USERNAME;
        }
        if (registerStatus.length) {
            res.render("register", 
                { status: registerStatus }
            );
        } else {
            var signUp = database.attemptRegistration(username, email, password);
            signUp
            .then(function (result) {
                if (!result) registerStatus = "User already exists";
                if (registerStatus.length) {
                    res.render("register", 
                        { status: registerStatus }
                    );
                } else {
                    // TODO:
                    res.render("login", 
                        { status: null });
                }
            }, errHandler);
        }
    });

    app.get("/login", function (req, res) {
        res.render("login", 
            { status: null });
    });

    app.post("/login", function (req, res) {
        var login = database.attemptLogin(req.body.email, req.body.password);
        login
        .then(function (user) {
            if (user) {
                req.session.user = user[0];
                res.redirect("code");
            } else {
                res.render("login", 
                    { status: "Invalid user combination" });
            }
        }, errHandler);
    });

    app.post("/run", function (req, res) {
        fs.writeFile("./exe/main.py", req.body.code, function (err) {
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
                res.json({
                    status: 200,
                    success: "Code output success",
                    outputType: outputType,
                    contents: contents // stderr takes priority
                });
            });
        });
    });

    app.post("/save", function (req, res) {
        var fileExists = database.checkFileExists(req.user.email, 
            req.body.file);
        fileExists
        .then(function (existFlag) {
            if (existFlag == null) {
                console.log("Unexpected error during save");
            } else {
                if (existFlag) {
                    res.json({
                        status: 409,
                        message: "Request override of file name"
                    });
                } else {
                    var save = database.saveNewFile(req.user.email, req.body.file, req.body.language, req.body.code);
                    save
                    .then(function (data) {
                        res.json({
                            status: 200,
                            success: "File saved successfully"
                        });
                    }, errHandler);
                }
            }
        }, errHandler);
    });

    app.post("/overwrite", function (req, res) {
        var deleteFile = database.deleteFile(req.user["email"], req.body.file);
        deleteFile
        .then(function (data) {
            if (!data) {
                console.log("Unexpected error when updating");
                return;
            }
        }).then (function () {
            return database.saveNewFile(req.user.email, req.body.file, 
                req.body.language, req.body.code);
        }).then (function (data) {
            res.json({
                status: 200,
                success: "File successfully overwritten"
            });
        }, errHandler);
    });

    app.get("/projects", function (req, res) {
        if (!req.user) {
            res.redirect("/");
        } else {
            var files = database.retrieveAllFiles(req.user.email);
            files
            .then(function (data) {
                res.render("projects", { 
                    user: req.user,
                    projects: data.Items 
                });
            }, errHandler);
        }
    });

    app.get("/load", function (req, res) {
        if (!req.user) {
            res.redirect("/");
            return;
        }
        var query = url.parse(req.url, true).query;
        if (query.project) {
            var project = database.retrieveSingleProject(req.user.email,
                query.project);
            project
            .then(function (projectData) {
                if (!projectData) res.redirect("/projects");
                res.render("code", { 
                    user: req.user,
                    fileName: encodeURI(projectData.fileName),
                    code: encodeURI(projectData.code),
                });
            }, errHandler);
        } else {
            res.redirect("/projects");
            return;
        }
    });

    return app;
});
