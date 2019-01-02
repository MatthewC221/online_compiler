var AWS         = require("aws-sdk");
var Promise     = require('promise');
var bcrypt      = require('bcrypt');

AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000"
});

var dynamodb = new AWS.DynamoDB.DocumentClient();

var SALT_ROUNDS = 10;
var USER_TABLE = "Users";

module.exports = {
    attemptRegistration: function (username, email, password) {
        var emailRegistered = {
            TableName: USER_TABLE,
            KeyConditionExpression: "email = :registerEmail",
            ExpressionAttributeValues: {
                ":registerEmail": email
            },
        };
        return new Promise (function (resolve, reject) {
            dynamodb.query(emailRegistered, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }).then(function (data) {
            if (data && data.Count) {
                throw new Error("Abort chain: email already registered");
            }
            return bcrypt.hash(password, SALT_ROUNDS);
        }).then(function (hash) {
            var registrationDate = new Date();
            var newUser = {
                TableName: USER_TABLE,
                Item: {
                    "username": username,
                    "password": hash,
                    "dateRegistered": registrationDate.toISOString(),
                    "teacherOf": [],      
                    "studentOf": [],
                    "teacher": true,      // Able to create courses
                    "recoveryCode": "tmp", 
                    "email": email
                }
            };
            dynamodb.put(newUser, function(err, data) {
                if (err) {
                    throw new Error("Abort chain: insertion failed");
                } 
            });
            return true;
        }).catch(function (rej) {
            console.log(rej);
            return null;
        });                   
    },

    attemptLogin: function (email, password) {
        var user = null;
        var params = {
            TableName: USER_TABLE,
            KeyConditionExpression: "email = :registerEmail",
            ExpressionAttributeValues: {
                ":registerEmail": email
            },
        };
        return new Promise (function (resolve, reject) {
            dynamodb.query(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }).then(function (data) {
            if (data && data.Count == 1) {
                user = data["Items"];
                console.log(data["Items"][0]["password"]);
            } else {
                throw new Error("Abort chain: email not registered");
            }
            return bcrypt.compare(password, data["Items"][0]["password"]);
        }).then(function (res, err) {
            if (err) {
                throw new Error("Abort chain: Unexpected error");
            } else {
                if (res) {
                    return user;
                }
            }
        }).catch(function (rej) {
            console.log(rej);
            return null;
        });
    }
}
