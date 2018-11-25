'use strict';
var fs          = require('fs');
var bodyParser  = require('body-parser');
var http        = require('http');
var path_module = require('path');
var express     = require('express');
var session     = require('client-sessions');

var app = express();

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path_module.join(__dirname, '/icons')));
app.use(express.static(path_module.join(__dirname, '/styles')));
app.use(express.static(path_module.join(__dirname, '/node_modules')));
app.use(express.static(path_module.join(__dirname, '/codemirror')));

require('./routes.js')(app);

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('trust proxy', 1);

var port = process.env.PORT || 1444;

app.listen(port, function() {
  console.log('Live at http://localhost:3333/');
});

http.createServer(app).listen(3333);
