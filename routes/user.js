var userSchema = require('../models/user.model');
var Users = new userSchema();
var logSchema = require('../models/log.model');
var Logs = new logSchema();
var bcrypt = require("bcrypt-nodejs");
var lastLoggedInAdmin={};
const WebSocket = require('ws');
var json2csv = require('json2csv');
var fs = require('fs');
var authenticated = null;
var extraLeft = 20;
var extraRight = 60;


var wss = new WebSocket.Server({port:3004});
var WS = null;
wss.on('connection', function connection(ws) {
    WS = ws;
    ws.on('message', function incoming(message) {
        console.log(message);
    });
});
/* GET home page. */
var user = {
    getAdmin: function(callback){
      userSchema.findOne({role:"admin"},{username:1,userId:1,role:1,adminCommand:1,isCommand:1},function(err,result){
         if(result){
             return callback(result);
         }
         else {
             return callback(null);
         }
      });
    },
    getAll: function(req, res) {
        userSchema.find({role:{$nin:["admin","superuser"]}},{username:1,fullName:1,createdAt:1,userId:1,role:1},function(err,usersx) {
            if (err)
                res.send({result: false, message: "Oops Something went wrong - please try again"});
            res.send(usersx);
        }).sort({'username':1});
    },

    getAllAdmins: function(req, res) {
        userSchema.find({$query:{role:{$in:["admin","superuser"]}},$orderBy:{username:1}},{username:1,userId:1,fullName:1,role:1},function(err,users) {
            if (err)
                res.send({result: false, message: "Oops Something went wrong - please try again"});
            res.send(users);
        });
    },

    getInfo: function(req, res,username) {
        userSchema.findOne({username:username},{username:1,fullName:1,userId:1,role:1},function(err,user) {
            if (err)
                res.send({result: false, message: "Oops Something went wrong - please try again"});
            if(user)
                res.send(user);
            else
                res.send({result: false, message: "User with username " + username + " Not found"});
        });
    },
    search:function(req,res){
        if(req.body.text) {
            var regex = `.*${req.body.text}.*`;
            console.log(regex);
            userSchema.find({$or:[{username:{$regex:regex}},{userId:regex}],role:{$nin:["admin","superuser","sabet"]}},{userId:1,username:1,role:1,createdAt:1},function(err,users){
               if(err) {
                   var date1 = new Date().toString();
                   var logObject1 = {
                       date: date1.split(" GMT")[0],
                       classId: 0,
                       username: "admin",
                       className: "err",
                       role: "admin",
                       type: "Error", // Access - Command - Admin
                       data: "search",
                   };
                   Logs.create(logObject1);
               }
               res.send(users);
            });
        }
        else{
            res.send({result:false,message:"504 Bad request"});
        }
    },
    register: function(req, res) {
        if(req.body.userId && req.body.userId.length < 14){
            userSchema.findOne({$or:[{username:req.body.username},{userId:req.body.userId}]},function(err,user){
                if(err) {
                    var date1 = new Date().toString();
                    var logObject1 = {
                        date: date1.split(" GMT")[0],
                        classId: 0,
                        username: "admin",
                        className: "err",
                        role: "admin",
                        type: "Error", // Access - Command - Admin
                        data: "register",
                    };
                    Logs.create(logObject1);
                    res.send({result: false, message: "Oops Something went wrong - please try again"});
                }
                if(user){
                    res.send({result:false,message:"user with username -> "+req.body["username"] + ", userId :"+ req.body.userId +" already exists"});
                }
                else{
                    let role = req.body.role;
                    let userObject = {
                        username:req.body.username,
                        userId:req.body.userId,
                        role :role,
                        sampling:false,
                        samplingType:"",
                        rfId:[],
                        fingerPrint:[],
                        password:"",
                        extraData : {},
                        command:"",
                        loggedIn:false,
                        isCommand:false,
                    };
                    let date = new Date().toString();
                    let logObject = {
                        date : date.split(" GMT")[0],
                        userId : req.body.userId,
                        username: req.body.username,
                        className: "null",
                        role : "Admin",
                        type : "Admin", // Access - Command - Admin
                        data : "Create",
                    };
                    Logs.create(logObject);
                    Users.create(req,res,userObject);
                }
            });
        }
        else{
            res.send({result:false,message:"invalid userId must be (6 - 14) characters"});
        }
    },
    registerAdmin : function(req,res) {
        userSchema.findOne({username: req.body.username}, function (err, user) {
            if (err)
                res.send({result: false, message: "Oops Something went wrong - please try again"});
            if (user) {
                res.send({
                    result: false,
                    message: "user with username -> " + req.body["username"] + " already exists"
                });
            }
            else {
                let hashPass = bcrypt.hashSync(req.body.password);
                console.log("hashpass : " + hashPass + "\n");
                let userObject = {
                    username: req.body.username,
                    fullName: req.body.fullName,
                    userId: "",
                    sampling: false,
                    samplingType:"",
                    rfId:[],
                    fingerPrint:[],
                    password : hashPass,
                    role: "admin",
                    adminCommand:[],
                    isCommand:false,
                    loggedIn:false
                };
                Users.create(req, res, userObject);
            }
        });
    },
    registerSuperUser : function(req,res,username,password) {
        var hashPass = bcrypt.hashSync(password);
        console.log(hashPass);
        var userObject = {
            username: username,
            fullName: username,
            userId: "",
            sampling: false,
            samplingType:"",
            rfId:[],
            fingerPrint:[],
            password : hashPass,
            role: "superuser",
            adminCommand:[],
            isCommand:false,
            loggedIn:false
        };
        Users.create(req, res, userObject);
    },
    edit: function(req, res) {
        if(req.body.userId && req.body.userId.length < 14){
            
            userSchema.findOne({username:req.body.newUsername},function(err,usx){
                if(err) {
                    var date1 = new Date().toString();
                    var logObject1 = {
                        date: date1.split(" GMT")[0],
                        classId: 0,
                        username: "admin",
                        className: "err",
                        role: "admin",
                        type: "Error", // Access - Command - Admin
                        data: "edit user",
                    };
                    Logs.create(logObject1);
                    res.send({result:false,message:"Oops Something Went Wrong"});
                }
                if(!usx || (usx.username === req.body.username)){
                    userSchema.findOne({userId:req.body.newUserId},function(err2,usrx){
                        if(err2){
                            var date1 = new Date().toString();
                            var logObject1 = {
                                date: date1.split(" GMT")[0],
                                classId: 0,
                                username: "admin",
                                className: "err2",
                                role: "admin",
                                type: "Error", // Access - Command - Admin
                                data: "edit user",
                            };
                            Logs.create(logObject1);
                            res.send({result:false,message:"Oops Something Went Wrong"});
                        }
                        if(!usrx || (usrx.username === req.body.username)){ 
                            userSchema.update({username: req.body.username},
                            {
                                $set: {
                                    username: req.body.newUsername,
                                    userId: req.body.newUserId
                                }
                            }, function (err, result) {
                                if (err) {
                                    res.send({result: false, message: "Oops Something went wrong - please try again"});
                                }
                                res.send(true);
                            });
                        }
                        else{
                            res.send({result:false,message:"userId "+req.body.newUserId + " already token !" });
                        }
                    });
                }
                else{
                    res.send({result:false,message:"username "+req.body.newUsername + " already token !" });
                }
            });
        }
        else{
            res.send({result:false,message:"invalid userId must be (6 - 14) characters"});
        }
    },

    delete: function(req, res) {

        userSchema.findOneAndRemove({username:req.body.username},function(err,result){
            if(err) {
                var date1 = new Date().toString();
                var logObject1 = {
                    date: date1.split(" GMT")[0],
                    classId: 0,
                    username: "admin",
                    className: "err",
                    role: "admin",
                    type: "Error", // Access - Command - Admin
                    data: "delete user",
                };
                Logs.create(logObject1);
                res.send({result:false,message:"Delete Failed !"});
            }
            if(result) {
                console.log(result);
                res.send(true);
            }
        });

    },
    SampleState : function(req, res,userxm) {

        if(req.body.username) {
            userSchema.findOneAndUpdate({username:req.body.username},{
                $set:{
                    sampling:true,
                    samplingType : req.body.type || "rfid"
                }
            },function(err,result){
                if(err) {
                    var date1 = new Date().toString();
                    var logObject1 = {
                        date: date1.split(" GMT")[0],
                        classId: 0,
                        username: "admin",
                        className: "err",
                        role: "admin",
                        type: "Error", // Access - Command - Admin
                        data: "sample state initial",
                    };
                    Logs.create(logObject1);
                    res.send({result:false,message:"Oops Something Went Wrong"});
                }
                if(result){
                    console.log(req.body.type);
                    if(req.body.type === "rfid" || req.body.type === "finger") {
                        let timeoutTime = 6000;
                        if(req.body.type === "finger"){
                            timeoutTime = 11000;
                            // commands to get finger print
                        }
                        WS.send(JSON.stringify({result:true,message:"'" + req.body.username+"' Set your RF-ID" ,type:"A"}), function (ack) {
                            console.log(" ACK :::::: "  + ack);
                        });
                        setTimeout(function () {
                            if(req.body.type === "finger"){
                                // commands to clean finger print state to listening
                            }
                            console.log('timeout completed - turn of take sample state');
                            userSchema.update({username: req.body.username}, {
                                $set: {
                                    sampling: false,
                                    samplingType : "",
                                    loggedIn:false
                                }
                            }, function (err, result) {
                                if (err) res.send({result: false, message: "Oops Something Went Wrong"});
                                if (result) {
                                    res.send({result: true, message: "Sample Process Done"});
                                }
                                else {
                                    res.send({result: false, message: "Oops Something went wrong"});
                                }
                            });
                        }, timeoutTime);
                    }
                }
                else{
                    res.send({result:false,message:"Oops Something went wrong"});
                }
            });


        }
        else{
            res.send({result:false,message:"504 Bad Request"});
        }
    },
    logout:function(req,res){
        userSchema.update({loggedIn:true},{
                $set:{
                    loggedIn:false,
                    sampling:false,
                    samplingType : ""
                }},function(err,result){
                if(err) throw err;
                if(result.n > 0){
                    res.send(true);
                }
                else{
                    res.send({result:false,message:"No One logged in "});
                }
        });
    },
    takeSample : function(req, res){
        userSchema.findOne({sampling:true},{username:1,fullName:1,userId:1,rfId:1,fingerPrint:1},function(err,userx) {
            if (err) res.send({result: false, message: "Oops Something Went Wrong"});
            if (userx) {
                if (req.body.rfId) {
                    let rfId = req.body.rfId;
                    let sendResponse = true;
                    if(userx.rfId.length === 2){
                        userSchema.update({username:userx.username},{
                            $pop:{rfId:-1}
                        },function(err,resultm){
                            if(err) throw err;
                            sendResponse = false;
                            console.log(resultm);
                        });
                    }
                    userSchema.findOneAndUpdate({sampling: true, samplingType:"rfid"},
                        {
                            $addToSet:{
                                rfId:rfId,
                            },
                            $set: {
                                sampling:false,
                                samplingType : ""
                            }
                        }, function (err, result) {
                            if (err)  res.send({result: false, message: " Oops Something Went Wrong"});
                            if(result) {
                                let date = new Date().toString();
                                let logObject = {
                                    date: date.split(" GMT")[0],
                                    classId: 0,
                                    userId:userx.userId,
                                    username: userx.username,
                                    className: "null",
                                    role: userx.role,
                                    type: "Access", // Access - Command - Admin
                                    data: "RFID-Sample",
                                };
                                Logs.create(logObject);
                                WS.send(JSON.stringify({result:true,type:"R",message:"RFID Registered : " +userx.username +" "}), function (ack) {
                                    console.log(" ACK :::::: "  + ack);
                                });
                                res.send({result:true,type:"R",message:"RFID Registered : " +userx.username +" "}); // access granted
                                
                            }
                            else{
                                let date = new Date().toString();
                                let logObject = {
                                    date: date.split(" GMT")[0],
                                    classId: 0,
                                    userId:null,
                                    username: "null",
                                    className: "null",
                                    role: "null",
                                    type: "Access", // Access - Command - Admin
                                    data: "RFID-Sample-Failed",
                                };
                                Logs.create(logObject);
                                WS.send(JSON.stringify({result:false,type:"R",message:"RFID Not Registered : " +userx.username +" "}), function (ack) {
                                    console.log(" ACK :::::: "  + ack);
                                });
                                if(sendResponse) {
                                    res.send({result:false,type:"R",message:"RFID Not Registered : " +userx.username +" "}); // access granted
                                }
                            }
                        });
                }
                else {
                    res.send({result: false, message: "504 Bad Request"});
                }
            }
            else{
                if(req.body.rfId) {
                    let rfId = req.body.rfId;
                    if (rfId) {
                        userSchema.findOne({loggedIn: true},function(err,userf) {
                            if(err) {
                                var date1 = new Date().toString();
                                var logObject1 = {
                                    date: date1.split(" GMT")[0],
                                    classId: 0,
                                    username: "admin",
                                    className: "err",
                                    role: "admin",
                                    type: "Error", // Access - Command - Admin
                                    data: "rfid err",
                                };
                                Logs.create(logObject1);
                            }
                            if(!userf){
                                userSchema.findOne({rfId: {$in:[rfId]}}, {username: 1,role:1,fullName: 1,command:1,extraData:1}, function (err, usr) {
                                if (err) console.log(err);
                                var date = new Date().toString();
                                if (usr) {
                                    console.log("Authenticated");
                                    var logObject = {
                                        date: date.split(" GMT")[0],
                                        classId:0,
                                        username: usr.username,
                                        className: "null",
                                        userId: usr.userId,
                                        type: "Access", // Access - Command - Admin
                                        data: "Authenticated / RFID : "+rfId,
                                    };
                                    WS.send(JSON.stringify({result:true,type:"G",message:"Wellcome " + usr.username,role:usr.role}), function (ack) {
                                        console.log(" ACK :::::: "  + ack);
                                    });
                                    res.send({result:true,type:"G",message:"Wellcome " + usr.username,role:usr.role});
                                }
                                else {
                                    console.log("Not Authenticated");
                                    logObject = {
                                        date: date.split(" GMT")[0],
                                        classId: 0,
                                        username: "null",
                                        className: "null",
                                        role: "null",
                                        type: "Access", // Access - Command - Admin
                                        data: "Not Authenticated / RFID : "+rfId,
                                    }
                                        authenticated = "Invalid RFID";
                                        Logs.create(logObject);
                                        WS.send(JSON.stringify({
                                            result: false,
                                            message: "Access Denied",
                                            type : "D"
                                    }), function (ack) {
                                            console.log(" ACK :::::: "  + ack);
                                        });
                                        res.send({
                                            result: false,
                                            message: "Access Denied",
                                            type : "D"
                                    });
                                }
                            });
                            }
                            else{
                                res.send({result:false,message:"Oops"});
                            }
                        });
                    }
                }
            }
        });
    },
    adminLogin : function(user,req,res){
        userSchema.update({username:user.username,loggedIn:false},{$set:{loggedIn:true}},function(err,result){
            if(err) throw err;
            if(result.n > 0){
                console.log("logged in admin + " + user.username);
            }
        });
        setTimeout(function(){
            userSchema.update({username:user.username,loggedIn:true},{$set:{loggedIn:false}});
        },120000);
        // blind user infos

        res.send(user);
    },
    getLogs:function(req,res){
        let fields = ["date","username","role","classId","userId","className","type","data"];
        let now = Date.now();
        let query = {};
        let timex = req.body.timeEdge || 0;
        if(req.body.timeEdge){
            let timeEdge = timex * 24 * 3600000;
            timeEdge = Date.now() - timeEdge ;
            query.createdAt = {$gte:timeEdge}
        }

        logSchema.find({$query: query, $orderBy: { createdAt : -1 }},function(err,lgs){
           if(err) {
               let date1 = new Date().toString();
               let logObject1 = {
                   date: date1.split(" GMT")[0],
                   classId: 0,
                   username: "admin",
                   className: "err",
                   role: "admin",
                   type: "Error", // Access - Command - Admin
                   data: "getLogs",
               };
               Logs.create(logObject1);

               res.send({result:false,message:"Oops - failed to get logs"});
           }

           if(lgs.length>0) {
               let csvData = json2csv({data: lgs, fields: fields});
               fs.writeFile("/home/pi/SmartEntrance/logs/logs.csv",csvData, function (err) {
                   if(err) {
                       let date2 = new Date().toString();
                       let logObject2 = {
                           date: date2.split(" GMT")[0],
                           classId: 0,
                           username: "admin",
                           className: "err",
                           role: "admin",
                           type: "Error", // Access - Command - Admin
                           data: "getLogs - fs write 1",
                       };
                       Logs.create(logObject2);
                       res.send({result:false,message:"err 1 log"});
                   }
                   else {
                       fs.writeFile("/home/pi/SmartEntrance/logs/logs-" + now + ".csv", csvData, function (err2) {
                           if (err2) {
                               let date3 = new Date().toString();
                               let logObject3 = {
                                   date: date3,
                                   classId: 0,
                                   username: "admin",
                                   className: "err",
                                   role: "admin",
                                   type: "Error", // Access - Command - Admin
                                   data: "getLogs - fs write 2",
                               };
                               Logs.create(logObject3);
                               res.send({result: false, message: "err 2 log"});
                           }
                           else {
                               res.send("logs-" + now + ".csv");
                           }
                       });
                   }
               });
           }
           else{
               res.send({result:false,message:"No logs found"});
           }
        });
    },  
};

module.exports = user;
