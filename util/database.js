var AWS         = require('aws-sdk');
var Promise     = require('promise');
var bcrypt      = require('bcrypt');
var fs          = require('fs');

var env = JSON.parse(fs.readFileSync('config.json', 'utf8'));
if (env.projectSettings.environment == 'development') {
    AWS.config.update({
        region: env.projectSettings.region,
        endpoint: env.projectSettings.endpoint
    });
} else {
    AWS.config.update({
        region: env.projectSettings.region
    });
}

var dynamodb = new AWS.DynamoDB.DocumentClient();

var SALT_ROUNDS = 10;
var USER_TABLE  = "Users";
var FREE_CODE   = "FreeCode";

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
    },

    checkFileExists: function (email, fileName) {
        var params = {
            TableName: FREE_CODE,
            Key: {
                "email": email,
                "fileName": fileName
            }
        };
        return new Promise (function (resolve, reject) {
            dynamodb.get(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }).then(function (data) {
            if (data && data.Item) {
                return true;
            } else {
                return false;
            }
        }).catch(function (rej) {
            console.log(rej);
            return null;
        });
    },

    saveNewFile: function (email, fileName, language, code) {
        var dateModified = new Date();
        var params = {
            TableName: FREE_CODE,
            Item: {
                "email": email,
                "fileName": fileName,
                "dateModified": dateModified.toISOString(),
                "readers": [],
                "code": code,
                "programmingLanguage": language
            }
        };
        return new Promise (function (resolve, reject) {
            dynamodb.put(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }).then(function (data) {
            return true;
        }).catch(function (rej) {
            console.log(rej);
            return null;
        });
    },

    deleteFile: function (email, fileName) {
        var params = {
            TableName: FREE_CODE,
            Key: {
                "email": email,
                "fileName": fileName
            }
        };
        return new Promise (function (resolve, reject) {
            dynamodb.delete(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }).then(function (data) {
            return true;
        }).catch(function (rej) {
            console.log(rej);
            return null;
        });
    },

    retrieveAllFiles: function (email) {
        var params = {
            TableName: FREE_CODE,
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
            return data;
        }).catch(function (rej) {
            console.log(rej);
            return null;
        });
    },

    retrieveSingleProject: function (email, fileName) {
        var params = {
            TableName: FREE_CODE,
            Key: {
                "email": email,
                "fileName": fileName
            }
        };
        return new Promise (function (resolve, reject) {
            dynamodb.get(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }).then(function (data) {
            if (data && data.Item) {
                return data.Item;
            } else {
                return null;
            }
        }).catch(function (rej) {
            console.log(rej);
            return null;
        });
    }
}
