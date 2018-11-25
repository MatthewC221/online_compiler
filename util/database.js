var Promise     = require('promise');
var bcrypt      = require('bcrypt');
var mongo       = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var url         = "mongodb://localhost";

var Client;
var Codelivedb;
var SALT_ROUNDS = 10;

MongoClient.connect(url, { useNewUrlParser: true }) 
.then (function (client) {
    Client     = client;
    Codelivedb = client.db("codelivedb");
    console.log("Connected to mongodb on localhost");
})
.catch (function (err) {
    console.log(err);
});

var USER_COLLECTION = "Users";
module.exports = {
    attemptLogin: function (email, password) {
        var usersCollection = Codelivedb.collection(USER_COLLECTION);
        var successfulUser;
        return new Promise (function (resolve, reject) {
            usersCollection.findOne({'email': email}, function (err, user) {
                if (err) {
                    reject(err);
                } else {
                    resolve(user);
                }
            }); 
        }).then(function (user) {
            if (!user) {
                throw new Error("User doesn't exist");
            }
            successfulUser = user;
            return bcrypt.compare(password, user.password);
        }).then (function (res) {
            if (res) {
                return successfulUser;
            } else {
                throw new Error("Incorrect password");
            }
        }).catch(function (rej) {
            console.log(rej);
            return null;
        });
    },
    // Unique username and unique email
    attemptRegistration: function (username, email, password) {
        var usersCollection = Codelivedb.collection(USER_COLLECTION);
        return new Promise (function (resolve, reject) {
            usersCollection.findOne({$or: [{"email": email}, 
                {"username": username}]}, function (err, user) {
                if (err) {
                    reject(err);
                } else {
                    resolve(user);
                }
            });
        }).then(function (user) {
            if (user) {
                throw new Error("Abort chain: user already exists");
            }
            return bcrypt.hash(password, SALT_ROUNDS);
        }).then(function (hash) {
            var registrationDate = new Date();
            var newUser = {
                username: username,
                password: hash,
                registrationDate: registrationDate,
                teacherOf: [],      
                studentOf: [],
                teacher: true,      // Able to create courses
                recoveryCode: "", 
                email: email
            };
            return usersCollection.insertOne(newUser);
        }).then(function (err, res) {
            return true;
        }).catch(function (rej) {
            console.log(rej);
            return null;
        });                   
    }
}