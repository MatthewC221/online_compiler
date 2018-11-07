'use strict';
var fs = require('fs');
var bodyParser = require('body-parser');
var http = require('http');
var path_module = require('path');
var routes = require('./routes.js');
var express = require('express');

var app = express();

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/styles', express.static(__dirname + '/styles'));

app.use(express.static(path_module.join(__dirname, '/icons')));
app.use(express.static(path_module.join(__dirname, '/views')));
app.use(express.static(path_module.join(__dirname, '/styles')));
app.use(express.static(path_module.join(__dirname, '/node_modules')));
app.use(express.static(path_module.join(__dirname, '/codemirror')));

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('trust proxy', 1);

app.use("/", routes);
app.use("/test", routes);

// Initialise server port
var port = process.env.PORT || 1444;

app.listen(port, function() {
  console.log('Live at http://localhost:3333/');
});

http.createServer(app).listen(3333);
