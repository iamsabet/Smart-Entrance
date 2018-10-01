var jwt = require('jwt-simple');
var userSchema = require('../models/user.model');
var bcrypt = require("bcrypt-nodejs");
var usrs = require("./user");
var auth = {

    login: function(req, res) {

        var username = req.body["username"] || '';
        var password = req.body["password"] || '';
        console.log(username + " --- " + password);
        if (username === '' || password === '') {
            res.status(401);
            res.send({
                result: false,
                message: "Invalid credentials"
            });
            return;
        }

        // Fire a query to your DB and check if the credentials are valid
        auth.validate(username, password,function(callback){
            var userDbObject = callback;

            if (!userDbObject) { // If authentication fails, we send a 401 back
                res.status(401);
                res.send({
                    result: false,
                    message: "Invalid credentials"
                });
                return;
            }
            if (userDbObject) {
                res.send(genToken(userDbObject));
            }
        });
    },

    validate: function(username, password,callback,req,res) {
        userSchema.count({},function(err,count){
            if(count > 0) {
                userSchema.findOne({username: username, role: {$in: ["admin", "superuser", "sabet"]}}, {
                    role: 1,
                    userId: 1,
                    username: 1,
                    password: 1
                }, function (err, user) {
                    if (err) console.log(err);
                    if (user) {
                        let compare = bcrypt.compareSync(password, user.password);
												console.log("hashed pass");
                        if (compare === true) {
                            // log log in
                            return callback(user);
                        }
                        else {
                            // log wrong password
                            return callback(null);
                        }
                    }
                    else {
                        // log user not found
                        userSchema.count({}, function (err, count) {
                            if (count === 0) {
                                console.log(bcrypt.hashSync(password));
                            }
                            return callback(null);
                        });
                    }
                });
            }
            else{
                usrs.registerSuperUser(req,res,username,password);
            }
        });
    },

    validateUser: function(key,callback) {
        // spoofing the DB response for simplicity
        userSchema.findOne({userId: key},{username:1,userId:1,password:1,role:1,fullName:1,adminCommand:1,isCommand:1}, function (err, user) {
            if (err) console.log(err);
            if (user) {
                return callback(user);
            }
            else {
                return null;
            }
        });
    }
};

function genToken(user) {
    let expires = expiresIn(1); // 1 days
    let token = jwt.encode({
        exp: expires,
    }, require('../config/secret')());

    return {
        token: token,
        key : user["userId"],
        username : user["username"]
    };
}

function expiresIn(numDays) {
    var dateObj = new Date();
    return dateObj.setDate(dateObj.getDate() + numDays);
}

module.exports = auth;
