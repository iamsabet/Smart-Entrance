var userSchema = require('../models/user.model');
var Users = new userSchema();
var logSchema = require('../models/log.model');
var Logs = new logSchema();
var classSchema = require('../models/class.model');
var classes = require('./class');
var presentSchema = require('../models/present.model');
var Presents = new presentSchema();
var bcrypt = require("bcrypt-nodejs");
var lastLoggedInAdmin={};
var json2csv = require('json2csv');
var fs = require('fs');
var authenticated = null;
var clientAllert = "";

var extraLeft = 20;
var extraRight = 60;

const WebSocket = require('ws');

const wss = new WebSocket.Server({port:3002});

// x = "F"
var WS = null;
wss.on('connection', function connection(ws) {
    WS = ws;
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
    // var CronJob = require('cron').CronJob;


    // new CronJob('5 * * * * *', function() {
    //     com = "F"
    //     if (x==="F"){
    //         com = "O" // open
    //         x = "O"
    //     }
    //     else{
    //         com = "F"
    //         x = "F"
    //     }
    //     classId = 205
    //     console.log("send :" + classId + "/"+com)
    //     WS.send((classId + com).toString(), function (ack) {
    //         console.log("response :"  ack)
    //     })
    
    // }, null, true);
});
/* GET home page. */
var user = {
    getAdmin: function(callback){
      userSchema.findOne({role:"admin"},{username:1,userId:1,role:1,fixedClass:1,adminCommand:1,isCommand:1},function(err,result){
         if(result){
             return callback(result);
         }
         else {
             return callback(null);
         }
      });
    },
    getAll: function(req, res) {
        userSchema.find({role:{$nin:["admin","superuser"]}},{username:1,fullName:1,fixedClass:1,role:1},function(err,users) {
            if (err)
                res.send({result: false, message: "Oops Something went wrong - please try again"});
            res.send(users);
        }).sort({'username':1});
    },

    getAllAdmins: function(req, res) {
        userSchema.find({$query:{role:{$in:["admin","superuser"]}},$orderBy:{username:1}},{username:1,fullName:1,fixedClass:1,role:1},function(err,users) {
            if (err)
                res.send({result: false, message: "Oops Something went wrong - please try again"});
            res.send(users);
        });
    },

    getInfo: function(req, res,username) {  
        userSchema.findOne({username:username},{username:1,fullName:1,fixedClass:1,role:1},function(err,user) {
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
            userSchema.find({username:{$regex:regex},role:{$nin:["admin","superuser","sabet"]}},function(err,users){
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
               console.log(users);
               res.send(users);
            });
        }
        else{
            res.send({result:false,message:"504 Bad request"});
        }
    },
    register: function(req, res) {

        userSchema.findOne({username:req.body.username},function(err,user){
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
                res.send({result:false,message:"user with username -> "+req.body["username"]+" already exists"});
            }
            else{
                let role = req.body.role;

                let userObject = {
                    username:req.body.username,
                    fullName:req.body.fullName,
                    fixedClass:!isNaN(parseInt(req.body.fixedClass)) ? parseInt(req.body.fixedClass) : 0,
                    userId :"",
                    sampling:false,
                    samplingType:"",
                    rfId:[],
                    fingerPrint:[],
                    password:"",
                    role: role || "teacher",
                    extraData : {},
                    command:"",
                    loggedIn:false,
                    isCommand:false,
                };
                let date = new Date().toString();
                let logObject = {
                    date : date.split(" GMT")[0],
                    classId : 0,
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
                    fixedClass:0,
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
            fixedClass:0,
            isCommand:false,
            loggedIn:false
        };
        Users.create(req, res, userObject);
    },
    edit: function(req, res) {

        userSchema.findOne({username:req.body.newUsername},function(err,user){
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
            if(!user || req.body.username === req.body.newUsername) {
                updateUserData = {
                    
                    username: req.body.newUsername,
                    fullName: req.body.fullName,
                    role: req.body.role
                    
                }
                if (req.body.fixedClass){
                    try{
                        fc = parseInt(req.body.fixedClass)
                        updateUserData.fixedClass = fc;
                    }
                    catch(e){
                        updateUserData.fixedClass = 0;
                    }
                }
                userSchema.update({username: req.body.username},
                    {
                        $set: updateUserData
                    }, function (err, result) {
                        if (err) {
                            res.send({result: false, message: "Oops Something went wrong - please try again"});
                        }
                        console.log(result);
                        classSchema.updateMany({ostadUsername:req.body.username},{
                            $set:{
                                ostadUsername : req.body.newUsername
                            }
                        },function(err,result){
                            if(err) res.send({result:false,message:"Oops Something Went Wrong"});
                            var date = new Date().toString();
                            console.log(result);
                            var logObject = {
                                date : date.split(" GMT")[0],
                                classId : 0,
                                username: req.body.username,
                                className: "null",
                                role : "Admin",
                                type : "Admin", // Access - Command - Admin
                                data : "Edit",
                            };
                            Logs.create(logObject);
                        });
                        res.send(true);
                    });
            }
            else{
                res.send({result:false,message:"username "+req.body.newUsername + " already token !" });
            }
        });
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

                classSchema.find({ostadUsername:req.body.username},{id:1,name:1,classId:1,ostadUsername:1},function(err,cls){
                    if(err) res.send({result:false,message:"Oops"});
                    if(cls.length > 0){
                        var date = new Date().toString();
                        for(let x = 0 ; x < cls.length ; x++) {
                            if(cls[x]) {
                                let date2 = new Date().toString();
                                classSchema.findOneAndRemove({id:cls[x].id},function(err){
                                    if(err) {
                                        var date1 = new Date().toString();
                                        var logObject1 = {
                                            date: date1.split(" GMT")[0],
                                            classId: 0,
                                            username: "admin",
                                            className: "err",
                                            role: "admin",
                                            type: "Error", // Access - Command - Admin
                                            data: "delete user classes",
                                        };
                                        Logs.create(logObject1);
                                        res.send({result:false,message:"Delete Failed !"});
                                    }
                                    if(result) {
                                        let logObject = {
                                            date: date2.split(" GMT")[0],
                                            classId: cls[x].classId || 0,
                                            username: cls[x].ostadUsername || "null",
                                            className: cls[x].name || "null",
                                            role: "Admin",
                                            type: "Admin", // Access - Command - Admin
                                            data: "Delete Class",
                                        };
                                        Logs.create(logObject);
                                    }
                                });

                            }
                        }
                        let logObject = {
                            date: date.split(" GMT")[0],
                            classId: 0,
                            username: req.body.username,
                            className: "null",
                            role: "Admin",
                            type: "Admin", // Access - Command - Admin
                            data: "Delete User",
                        };
                        Logs.create(logObject);
                        res.send({result:true,data:cls});
                    }
                    else {
                        res.send(true);
                    }
                });
            }
        });

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
    SampleState : function(req, res) {

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
                        let timeoutTime = 7000;
                        if(req.body.type === "finger"){
                            timeoutTime = 11000;
                            // commands to get finger print
                        }
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
    takeSample : function(req, res){
        userSchema.findOne({sampling:true},{username:1,fullName:1,rfId:1,fingerPrint:1},function(err,userx) {
            if (err) res.send({result: false, message: "Oops Something Went Wrong"});
            if (userx) {
                if (req.body.rfId) {
                    let rfId = req.body.rfId;
                    let sendResponse = true;
                    if(userx.rfId.length === 5){
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
                                    username: userx.username,
                                    className: "null",
                                    role: userx.role,
                                    type: "Access", // Access - Command - Admin
                                    data: "RFID-Sample",
                                };
                                Logs.create(logObject);
                                clientAllert = userx.username+ " Your RFID successfully registered";
                                if(sendResponse) {
                                    res.send({result: true, message: clientAllert});
                                }
                            }
                            else{
                                let date = new Date().toString();
                                let logObject = {
                                    date: date.split(" GMT")[0],
                                    classId: 0,
                                    username: "null",
                                    className: "null",
                                    role: "null",
                                    type: "Access", // Access - Command - Admin
                                    data: "RFID-Sample-Failed",
                                };
                                Logs.create(logObject);
                                clientAllert = userx.username + " Error reading rfid ";
                                if(sendResponse) {
                                    res.send({result: true, message: clientAllert});
                                }
                            }
                        });
                }
                else if (req.body.fingerPrint) { // needs to be fixed

                    // List of datas
                    userSchema.findOneAndUpdate({sampling: true , samplingType:"fingerprint" },
                        {
                            $addToSet:req.body.fingerPrint,
                            $set: {
                                sampling : false,
                                samplingType:"fingerprint"
                            }
                        }, function (err, result) {
                            if (err) {
                                res.send({result: false, message: " Oops Something Went Wrong"});
                            }
                            var date = new Date().toString();
                            var logObject = {
                                date : date.split(" GMT")[0],
                                classId : 0,
                                username: userx.username ,
                                className: "null",
                                role : userx.role,
                                type : "Access", // Access - Command - Admin
                                data : "FingerPrint-Sample",
                            };
                            Logs.create(logObject);
                            clientAllert = userx.username+ " Your RFID successfully registered";
                            res.send({result:true,message: clientAllert });
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
                        console.log("RFID  :" + rfId);
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
                                userSchema.findOne({rfId: {$in:[rfId]}}, {username: 1,role:1,fullName: 1,command:1,extraData:1,fixedClass:1}, function (err, usr) {
                                if (err) console.log(err);
                                var date = new Date().toString();
                                if (usr) {
                                    console.log("Authenticated");
                                    var logObject = {
                                        date: date.split(" GMT")[0],
                                        classId: 0,
                                        username: usr.username,
                                        className: "null",
                                        role: usr.role,
                                        type: "Access", // Access - Command - Admin
                                        data: "Authenticated / RFID : "+rfId,
                                    };
                                    if(usr.role === "superuser" || usr.role === "admin" || usr.role === "superuser")
                                        user.adminLogin(usr,req,res);
                                    else
                                        user.classAuthority(usr,res);
                                      Logs.create(logObject);
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
                                    };
                                    authenticated = "Invalid RFID";
                                    Logs.create(logObject);
                                    res.send({
                                        result: false,
                                        message: "NOT Authenticated"
                                    });
                                }
                            });
                            }
                            else{
                                res.send({result:false,message:"Someone Else already Logged in"});
                            }
                        });
                    }
                }
                else if(req.body.fingerPrint){
                    let fingerPrint = req.body.fingerPrint;
                    if(fingerPrint) {
                        console.log("FingerPrint  :" + fingerPrint);
                        userSchema.findOne({fingerPrint: {$in:[fingerPrint]}}, {username: 1, fullName: 1,role:1,fixedClass:1}, function (err, usr) {
                            if (err) console.log(err);
                            var date = new Date().toString();
                            if (usr) {
                                console.log("Authenticated");
                                var logObject = {
                                    date: date.split(" GMT")[0],
                                    classId: 0,
                                    username: usr.username,
                                    className: "null",
                                    role: usr.role,
                                    type: "Access", // Access - Command - Admin
                                    data: "Authenticated / FINGERPRINT : " + fingerPrint,
                                };
                                user.classAuthority(usr, res);
                                Logs.create(logObject);

                            }
                            else {
                                logObject = {
                                    date: date.split(" GMT")[0],
                                    classId: 0,
                                    username: "null",
                                    className: "null",
                                    role: usr.role,
                                    type: "Access", // Access - Command - Admin
                                    data: "NOT Authenticated / FINGERPRINT : " + fingerPrint,
                                };
                                Logs.create(logObject);
                                authenticated = "Invalid Fingerprint";
                                res.send({result: false, message: "Not Authenticated"});
                                Logs.create(logObject);
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

    classAuthority : function(userx,res,mode) {
        var now = new Date();
        var thisTime = now.toString().split(" ");
        var thisday = thisTime[0];
        var thisDay = 1;
        console.log("mode :" + mode);
        if(userx.role!=="superstudent"){
            switch (thisday) {
                case"Sat": {
                    thisDay = 1;
                }break;
                case"Sun": {
                    thisDay = 2;
                }break;
                case"Mon": {
                    thisDay = 3;
                }break;
                case"Tue": {
                    thisDay = 4;
                } break;
                case"Wed": {
                    thisDay = 5;
                }break;
                case"Thu": {
                    thisDay = 6;
                }break;
                case"Fri": {
                    thisDay = 7;
                }break;
            }
            if(mode === true){
                thisDay = 8;
                thisday = "All";
            }
            let thisHour = parseInt(thisTime[4].split(":")[0]);
            let thisMinute = parseInt(thisTime[4].split(":")[1]);
            let thisLeft = (thisDay * 24 * 60) + (thisHour * 60) + thisMinute;
            let thisLeftNew = thisLeft + extraLeft; //
            let thisRightNew = thisLeft - extraRight; //
            let query = {
                ostadUsername: userx.username,
                day: thisday,
                left: {$lt: thisLeftNew},
                right: {$gt: thisRightNew}
            };
            if(userx.role==="student"){
                query.ostadUsername = {$exists:true};
                query.isPublic = true;
                query.studentsList = {$in:[userx.username]};
            }   
            classSchema.find({
                $query:query,$orderBy: {left: -1}
            }, {
                ostadFullName: 1,
                name: 1,
                day: 1,
                leftDate: 1,
                rightDate: 1,
                left: 1,
                situation: 1,
                right: 1,
                classId: 1,
                id: 1,
                ostadUsername: 1,
                accessProject:1,
                isPublic:1,
                studentsList:1
            }, function (err, cls) {
                if (err) {
                    let date1 = new Date().toString();
                    let logObject1 = {
                        date: date1.split(" GMT")[0],
                        classId: 0,
                        username: "admin",
                        className: "err",
                        role: "admin",
                        type: "Error", // Access - Command - Admin
                        data: "class authority err",
                    };
                    Logs.create(logObject1);
                    res.send({result: false, message: "Oops Something went wrong !"});
                }
                if (cls.length > 0) { // give it a fake class obj for log and update and future responses 
                    if (userx) {
                        if(thisLeft - cls[0].right > 21){
                            let date = new Date().toString();
                            let logObject = {
                                date: date.split(" GMT")[0],
                                classId: cls[0].classId,
                                username: userx.username,
                                className: cls[0].name,
                                role: userx.role,
                                type: "After Timeout", // Access - Command - Admin
                                data: "Authorized",
                            };
                            Logs.create(logObject);
                            res.send({result:false,message:"' "+ userx.username +"' Your class has been closed automaticly by timeout , but we logged your recent effort"});
                        }
                        else {
                            let updatesx = {
                                    class: cls[0],
                                    user: userx
                            };
                            if(cls.length === 2){
                                updatesx.class2 = cls[1];
                            }
                            userSchema.findOneAndUpdate({username: userx.username}, {
                                $set: {
                                    extraData: updatesx,
                                    loggedIn: true
                                }
                            }, function (err, result) {
                                if (err) console.log(err);
                                if (result) {
                                    let date = new Date().toString();
                                    let logObject = {
                                        date: date.split(" GMT")[0],
                                        classId: cls[0].classId,
                                        username: userx.username,
                                        className: cls[0].name,
                                        role: userx.role,
                                        type: "Access", // Access - Command - Admin
                                        data: "Authorized",
                                    };
                                    result.save();
                                    Logs.create(logObject);
                                    setTimeout(function () {
                                        userSchema.findOne({
                                            username: userx.username,
                                        }, {
                                            extraData: 1,
                                            loggedIn: 1,
                                            username: 1,
                                            fullName: 1,
                                            command: 1
                                        }, function (err, resultz) {
                                            if (resultz) {
                                                if (resultz.extraData && resultz.extraData.class) {

                                                    res.send({
                                                        classId: resultz.extraData.class.classId,
                                                        command: resultz.command
                                                    });
                                                }
                                                else {
                                                    res.send({result: false, message: "Oops Something went wrong"});
                                                }
                                                resultz.save();
                                                userSchema.update({username: userx.username}, {
                                                    $set: {
                                                        extraData: {},
                                                        command: "",
                                                        loggedIn: false
                                                    }
                                                }, function (err, res) {
                                                    if (err) throw err;
                                                    if (res.n > 0) {
                                                        logObject = {
                                                            date: date.split(" GMT")[0],
                                                            classId: cls[0].classId,
                                                            username: userx.username,
                                                            className: cls[0].name,
                                                            role: userx.role,
                                                            type: "Access", // Access - Command - Admin
                                                            data: "logged out",
                                                        };
                                                        Logs.create(logObject);
                                                    }
                                                    else {
                                                        logObject = {
                                                            date: date.split(" GMT")[0],
                                                            classId: cls[0].classId,
                                                            username: resultz.username,
                                                            className: cls[0].name,
                                                            role: userx.role,
                                                            type: "Access", // Access - Command - Admin
                                                            data: "log out failed",
                                                        };
                                                        Logs.create(logObject);
                                                    }
                                                });
                                            }
                                            else {
                                                res.send({result: false, message: "Oops"});
                                            }
                                        });
                                    }, 9000);

                                }
                                else {
                                    res.send({result: false, message: "Oops Something Went Wrong"});
                                }
                            });
                        }
                    }
                    else {
                        authenticated =  "'" + userx.username + "' No user selected ";
                        res.send({result: false, message: authenticated});
                    }
                }
                else{
                    if(mode === undefined) {
                        console.log(" Go For All Days");
                        user.classAuthority(userx,res,true);
                    }
                    else {
                        authenticated = "'" + userx.username + "' No class is available for you right now ";
                        res.send({result: false, message: authenticated});
                    }
                }
            });
        }
        else{
            // superstudent
            // eyne admin
            if(!userx.fixedClass){
                res.send({"result":false,"message":"No one Logged In"});
            }
            else{
                list_final = [];
                classes.getAll(null,null,"Number",false,function(list){
                    for (cls in list){
                        if(list[cls].classId === userx.fixedClass){
                            list_final.push(list[cls]);
                        }
                    }
                    
                    cls = list_final;
                    // userx
                    if(cls.length === 0){
                        res.send({result:false,message:"No Room Is Available for you right now"})
                    }
                    else{
                        let updatesx = {
                            class: cls[0],
                            user: userx
                        };
                        if(cls.length === 2){
                            // updatesx.class2 = cls[1];
                        }
                        userSchema.findOneAndUpdate({username: userx.username}, {
                            $set: {
                                extraData: updatesx,
                                loggedIn: true
                            }
                        }, function (err, result) {
                            if (err) console.log(err);
                                if (result) {
                                let date = new Date().toString();
                                let logObject = {
                                    date: date.split(" GMT")[0],
                                    classId: cls[0].classId,
                                    username: userx.username,
                                    className: cls[0].name,
                                    role: userx.role,
                                    type: "Access", // Access - Command - Admin
                                    data: "Authorized",
                                };
                                result.save();
                                Logs.create(logObject);
                                setTimeout(function () {
                                    userSchema.findOne({
                                        username: userx.username,
                                    }, {
                                        extraData: 1,
                                        loggedIn: 1,
                                        username: 1,
                                        fullName: 1,
                                        fixedClass:1,
                                        command: 1
                                    }, function (err, resultz) {
                                        if (resultz) {
                                            if (resultz.extraData && resultz.extraData.class) {

                                                res.send({
                                                    classId: resultz.extraData.class.classId,
                                                    command: resultz.command
                                                });
                                            }
                                            else {
                                                res.send({result: false, message: "Oops Something went wrong"});
                                            }
                                            resultz.save();
                                            userSchema.update({username: userx.username}, {
                                                $set: {
                                                    extraData: {},
                                                    command: "",
                                                    loggedIn: false
                                                }
                                            }, function (err, res) {
                                                if (err) throw err;
                                                if (res.n > 0) {
                                                    logObject = {
                                                        date: date.split(" GMT")[0],
                                                        classId: cls[0].classId,
                                                        username: userx.username,
                                                        className: cls[0].name,
                                                        role: userx.role,
                                                        type: "Access", // Access - Command - Admin
                                                        data: "logged out",
                                                    };
                                                    Logs.create(logObject);
                                                }
                                                else {
                                                    logObject = {
                                                        date: date.split(" GMT")[0],
                                                        classId: cls[0].classId,
                                                        username: resultz.username,
                                                        className: cls[0].name,
                                                        role: userx.role,
                                                        type: "Access", // Access - Command - Admin
                                                        data: "log out failed",
                                                    };
                                                    Logs.create(logObject);
                                                }
                                            });
                                        }
                                        else {
                                            res.send({result: false, message: "Oops"});
                                        }
                                    });
                                }, 9000);

                            }
                            else {
                                res.send({result: false, message: "Oops Something Went Wrong"});
                            }
                        });
                    }
                });
               
            }
        }
    },
    checkAuth:function(req,res){

        if(authenticated === null) {
            userSchema.findOne({loggedIn: true}, {extraData: 1, username: 1, fullName: 1,role:1}, function (err, result) {
                if (err) {
                    var date1 = new Date().toString();
                    var logObject1 = {
                        date: date1.split(" GMT")[0],
                        classId: 0,
                        username: "admin",
                        className: "err",
                        role: "admin",
                        type: "Error", // Access - Command - Admin
                        data: "check auth",
                    };
                    Logs.create(logObject1);
                }
                if (result) {

                    res.send({result: true, data: result});
                }
                else {
                    if(clientAllert === "") {
                        userSchema.findOne({sampling: true}, {
                            username: 1,
                            fullName: 1,
                            samplingType: 1,
                            sampling: 1
                        }, function (err, result) {
                            if (err) {
                                var date1 = new Date().toString();
                                var logObject1 = {
                                    date: date1.split(" GMT")[0],
                                    classId: 0,
                                    username: "admin",
                                    className: "err",
                                    role: "admin",
                                    type: "Error", // Access - Command - Admin
                                    data: "check auth",
                                };
                                Logs.create(logObject1);
                            }
                            if (result) {
                                res.send({result: true, data: result});
                            }
                            else {
                                res.send({result: false, message: "No one Logged In"});
                            }
                        });
                    }
                    else{

                        res.send({result:false,data:{alertText:clientAllert}});
                        clientAllert = "";
                    }
                }

            });
        }
        else{
            res.send({result:false,message:authenticated});
            authenticated = null;
        }
    },
    on:function(req,res){
        //
        let now = new Date();
        let thisTime = now.toString().split(" ");
        let thisDay = thisTime[0];


        switch (thisDay) {
            case"Sat":{
                thisDay = 1;
            }break;
            case"Sun":{
                thisDay = 2;
            }break;
            case"Mon":{
                thisDay = 3;
            }break;
            case"Tue":{
                thisDay = 4;
            }break;
            case"Wed":{
                thisDay = 5;
            }break;
            case"Thu":{
                thisDay = 6;
            }break;
            case"Fri":{
                thisDay = 7;
            }break;
        }
        let thisHour = parseInt(thisTime[4].split(":")[0]);
        let thisMinute = parseInt(thisTime[4].split(":")[1]);
        let thisLeft = (thisDay*24*60) + (thisHour*60) + thisMinute;


        userSchema.findOne({loggedIn:true,role:{$in:["student","teacher","superstudent"]}},{role:1,extraData:1,fixedClass:1,username:1},function(err,result){
            if(err) {
                let date1 = new Date().toString();
                let logObject1 = {
                    date: date1.split(" GMT")[0],
                    classId: 0,
                    username: "admin",
                    className: "err",
                    role: "admin",
                    type: "Error", // Access - Command - Admin
                    data: "on",
                };
                Logs.create(logObject1);
            }

            if(result) {
                if(result.role === "superstudent"){
                    user.adminCommand({
                        body: {
                            classId: result.extraData.class.classId,
                            command: "open"
                        }
                    }, null,result, null); 

                    classSchema.findOneAndUpdate({
                        id: result.extraData.class.id,
                    }, {$set: {situation: "open"}}, function (err, clas) {
                        if (err) {
                            let date1 = new Date().toString();
                            let logObject1 = {
                                date: date1.split(" GMT")[0],
                                classId: 0,
                                username: "admin",
                                className: "err",
                                role: "admin",
                                type: "Error", // Access - Command - Admin
                                data: "on class update",
                            };
                            Logs.create(logObject1);
                        }
                        else{
                            if (clas) {
                                res.send({result: true, command: "On", data: clas});
                                let date = new Date().toString();
                                let logObject = {
                                    date: date.split(" GMT")[0],
                                    classId: clas.classId || 0,
                                    username: result.username,
                                    className: clas.name,
                                    role: "superstudent",
                                    type: "Command", // Access - Command - Admin
                                    data: "open",
                                };
                                Logs.create(logObject);
                                userSchema.findOneAndUpdate({loggedIn: true, role: "superstudent"}, {
                                    $set: {
                                        command: "O",
                                        loggedIn: false
                                    }
                                }, function (err, resx) {
                                    if (err) throw err;
                                    if (resx) {
                                        let date = new Date().toString();
                                        
                                        console.log("className : " + clas.name);
                                        let presentObject = {
                                            date: date.split(" GMT")[0],
                                            classId: clas.classId || 0,
                                            username: resx.username,
                                            className: clas.name,
                                            class_id: clas.id
                                        };
                                        Presents.create(presentObject);
                                    }
                                    else {
                                        let date = new Date().toString();
                                        let logObject = {
                                            date: date.split(" GMT")[0],
                                            classId: clas.classId || 0,
                                            username: clas.ostadUsername,
                                            className: clas.name,
                                            role: "superstudent",
                                            type: "Command", // Access - Command - Admin
                                            data: "open-error",
                                        };
                                        Logs.create(logObject);
                                    }
                                });
                                
                            }
                        }
                    });
                }
                else if(result.role === "student") {
                    classSchema.findOneAndUpdate({
                        id: result.extraData.class.id,
                    }, {$set: {situation: "open"}}, function (err, clas) {
                        if (err) {
                            let date1 = new Date().toString();
                            let logObject1 = {
                                date: date1.split(" GMT")[0],
                                classId: 0,
                                username: "admin",
                                className: "err",
                                role: "admin",
                                type: "Error", // Access - Command - Admin
                                data: "on class update",
                            };
                            Logs.create(logObject1);
                        }
                        else{
                            if (clas) {
                                // classSchema.updateMany({
                                //     classId: result.extraData.class.classId,
                                // }, {$set: {situation: "open"}}, function (err, cls) {
                                //     if (err) {
                                // }});
                                res.send({result: true, command: "On", data: clas});
                                let date = new Date().toString();
                                let logObject = {
                                    date: date.split(" GMT")[0],
                                    classId: clas.classId || 0,
                                    username: result.username,
                                    className: clas.name,
                                    role: "student",
                                    type: "Command", // Access - Command - Admin
                                    data: "open",
                                };
                                Logs.create(logObject);
                                userSchema.findOneAndUpdate({loggedIn: true, role: "student"}, {
                                    $set: {
                                        command: "O",
                                        loggedIn: false
                                    }
                                }, function (err, resx) {
                                    if (err) throw err;
                                    if (resx) {
                                        let date = new Date().toString();
                                        let logObject = {
                                            date: date.split(" GMT")[0],
                                            classId: clas.classId || 0,
                                            username: resx.username,
                                            className: clas.name,
                                            role: "student",
                                            type: "logout", // Access - Command - Admin
                                            data: "before time",
                                        };
                                        console.log("className : " + clas.name);
                                        let presentObject = {
                                            date: date.split(" GMT")[0],
                                            classId: clas.classId || 0,
                                            username: resx.username,
                                            className: clas.name,
                                            class_id: clas.id
                                        };
                                        Presents.create(presentObject);
                                    }
                                    else {
                                        let date = new Date().toString();
                                        let logObject = {
                                            date: date.split(" GMT")[0],
                                            classId: clas.classId || 0,
                                            username: clas.ostadUsername,
                                            className: clas.name,
                                            role: "student",
                                            type: "Command", // Access - Command - Admin
                                            data: "open-error",
                                        };
                                        Logs.create(logObject);
                                    }
                                });
                                let timeOutTime = 60000;
                                console.log("timeout close student");
                                setTimeout(function () {
                                    user.adminCommand({
                                        body: {
                                            classId: clas.classId,
                                            command: "close"
                                        }
                                    }, null, null);
                                    let date2 = new Date().toString();
                                    let logObject2 = {
                                        date: date2.split(" GMT")[0],
                                        classId: clas.classId || 0,
                                        username: clas.ostadUsername,
                                        className: clas.name,
                                        role: "admin",
                                        type: "timeout", // Access - Command - Admin
                                        data: "timeout-student",
                                    };
                                    Logs.create(logObject2);
                                }, timeOutTime); // 60s
                            }
                        }
                    });
                }
                else if(result.role === "teacher") {

                    let date = new Date().toString();
                    console.log((req.body) && (req.body.classId) && (!isNaN(req.body.classId)) && ((result.extraData.class.accessProject === null) || (parseInt(req.body.classId) === result.extraData.class.accessProject)));
                    if (result.extraData.class.accessProject !== null) {
                        if ((req.body) && (req.body.classId) && (!isNaN(req.body.classId)) && ((result.extraData.class.accessProject === null) || (parseInt(req.body.classId) === result.extraData.class.accessProject))) {

                                let classId = result.extraData.class.classId;
                                let id = result.extraData.class.id;
                                let className = result.extraData.class.name;
                                if(result.extraData.class.accessProject && (parseInt(result.extraData.class.accessProject) === parseInt(req.body.classId))){
                                    classId = parseInt(result.extraData.class.accessProject);
                                    // id = result.extraData.class.id ;
                                    className = "Project Room";
                                }
                                if(result.extraData.class2 && (parseInt(result.extraData.class2.classId) === parseInt(req.body.classId))){
                                        classId = parseInt(result.extraData.class2.classId);
                                        id = result.extraData.class2.id ;
                                        className = result.extraData.class2.name;
                            }
													
                            result.save();
                            userSchema.update({username: result.username}, {
                                $set: {
                                    "extraData.class.classId": classId,
                                    command: "O",
                                    loggedIn: false
                                }
                            }, function (err, resx) {
                                if (resx.n > 0) {
                                    classSchema.findOneAndUpdate({
                                        classId: classId,
                                    }, {$set: {situation: "open"}}, function (err, cls2) { // command on project room 202
                                        if (err) throw err;
                                        if (cls2) {
                                            let logObject = {
                                                date: date.split(" GMT")[0],
                                                classId: classId,
                                                username: result.extraData.class.ostadUsername,
                                                className: className,
                                                role: result.role,
                                                type: "Command", // Access - Command - Admin
                                                data: "open",
                                            };
                                            Logs.create(logObject);
                                            let presentObject = {
                                                date: date.split(" GMT")[0],
                                                classId: classId,
                                                username: result.username,
                                                className: className,
                                                class_id : id
                                            };
                                            Presents.create(presentObject);
                                            res.send({result: true, command: "On", data: result});
                                            // classSchema.updateMany({
                                            //     classId: classId,
                                            // }, {$set: {situation: "open"}}, function (err, cls) {
                                            //     if (err) {
                                            // }});
                                            let timeOutTime = 40000;
                                            setTimeout(function () {
                                                user.adminCommand({
                                                    body: {
                                                        classId: result.extraData.class.accessProject,
                                                        command: "close"
                                                    }
                                                }, null, lastLoggedInAdmin);
                                                let date2 = new Date().toString();
                                                let logObject2 = {
                                                    date: date2.split(" GMT")[0],
                                                    classId: classId,
                                                    username: result.extraData.class.ostadUsername,
                                                    className: className,
                                                    role: "admin",
                                                    type: "timeout", // Access - Command - Admin
                                                    data: "timeout-close",
                                                };
                                                Logs.create(logObject2);
                                            }, timeOutTime); // 40s
                                        }
                                    });
                                }
                            });
                        }
                        else{
                            let classId = result.extraData.class.classId;
                            let id = result.extraData.class.id;
                            let className = result.extraData.class.name;

                            if(result.extraData.class2 && (parseInt(result.extraData.class2.classId) === parseInt(req.body.classId))){
                                classId = parseInt(result.extraData.class2.classId);
                                id = result.extraData.class2.id ;
                                className = result.extraData.class2.name
                            }
                          classSchema.findOneAndUpdate({
                                id: id,
                                classId: classId
                            }, {$set: {situation: "open"}}, function (err, clas) {
                                if (err) {
                                    let date1 = new Date().toString();
                                    let logObject1 = {
                                        date: date1.split(" GMT")[0],
                                        classId: 0,
                                        username: "admin",
                                        className: "err",
                                        role: "admin",
                                        type: "Error", // Access - Command - Admin
                                        data: "on class update",
                                    };
                                    Logs.create(logObject1);
                                }
                                if (clas) {
                                    // classSchema.updateMany({
                                    //     classId: classId,
                                    // }, {$set: {situation: "open"}}, function (err, cls) {
                                    //     if (err) {
                                    // }});
                                    // console.log("updated");
                                    let date = new Date().toString();
                                    let logObject = {
                                        date: date.split(" GMT")[0],
                                        classId: clas.classId || 0,
                                        username: clas.ostadUsername,
                                        className: clas.name,
                                        role: "teacher",
                                        type: "Command", // Access - Command - Admin
                                        data: "open",
                                    };
                                    Logs.create(logObject);
                                    userSchema.update({
                                        loggedIn: true,
                                    }, {$set: {command: "O", loggedIn: false}}, function (err, resx) {
                                        if (err) throw err;
                                        if (resx.n > 0) {
                                            let logObject = {
                                                date: date.split(" GMT")[0],
                                                classId: classId || 0,
                                                username: result.username,
                                                className: className,
                                                role: "teacher",
                                                type: "logout", // Access - Command - Admin
                                                data: "before time",
                                            };
                                            Logs.create(logObject);
                                            let presentObject = {
                                                date: date.split(" GMT")[0],
                                                classId: classId || 0,
                                                username: result.username,
                                                className: className,
                                                class_id : id
                                            };
                                            Presents.create(presentObject);
                                        }
                                        res.send({result: true, command: "On", data: result});
                                    });

                                }
                                else {
                                    res.send({
                                        result: true,
                                        message: "logged and changed situation but not send close command"
                                    });
                                }
                            });
                        }
                    }
                    else {
                        let classId = result.extraData.class.classId;
                        let id = result.extraData.class.id;
                        let className = result.extraData.class.name;
                        if(result.extraData.class2){
                            console.log(parseInt(result.extraData.class2.classId) === parseInt(req.body.classId));
                            if(parseInt(result.extraData.class2.classId) === parseInt(req.body.classId)){
                                classId = parseInt(result.extraData.class2.classId);
                                id = result.extraData.class2.id ;
                                className = result.extraData.class2.name
                            }
                        }
                        classSchema.findOneAndUpdate({
                            id: id,
                            classId: classId
                        }, {$set: {situation: "open"}}, function (err, clas) {
                            if (err) {
                                let date1 = new Date().toString();
                                let logObject1 = {
                                    date: date1.split(" GMT")[0],
                                    classId: 0,
                                    username: "admin",
                                    className: "err",
                                    role: "admin",
                                    type: "Error", // Access - Command - Admin
                                    data: "on class update",
                                };
                                Logs.create(logObject1);
                            }
                            if (clas) {
                                // classSchema.updateMany({
                                //     classId: classId,
                                // }, {$set: {situation: "open"}}, function (err, cls) {
                                //     if (err) {
                                // }});
                                // console.log("updated");
                                let date = new Date().toString();
                                let logObject = {
                                    date: date.split(" GMT")[0],
                                    classId: clas.classId || 0,
                                    username: clas.ostadUsername,
                                    className: clas.name,
                                    role: "teacher",
                                    type: "Command", // Access - Command - Admin
                                    data: "open",
                                };
                                Logs.create(logObject);
                                userSchema.update({
                                    loggedIn: true,
                                }, {$set: {command: "O", loggedIn: false}}, function (err, resx) {
                                    if (err) throw err;
                                    if (resx.n > 0) {
                                        let logObject = {
                                            date: date.split(" GMT")[0],
                                            classId: classId || 0,
                                            username: result.username,
                                            className: className,
                                            role: "teacher",
                                            type: "logout", // Access - Command - Admin
                                            data: "before time",
                                        };
                                        Logs.create(logObject);

                                        let presentObject = {
                                            date: date.split(" GMT")[0],
                                            classId: classId || 0,
                                            username: result.username,
                                            className: clas.name,
                                            class_id : className
                                        };
                                        Presents.create(presentObject);
                                    }
                                    res.send({result: true, command: "On", data: result});
                                });
                            }
                            else {
                                res.send({
                                    result: true,
                                    message: "logged and changed situation but not send close command"
                                });
                            }
                        });
                    }
                }
                else{
                    res.send({result:false,message:"504 Bad Request"});
                }
            }
            else{
                res.send({result:false,message:"System is busy try again please"});
            }
            
        });
    },

    off:function(req,res){
        userSchema.findOne({loggedIn:true},{role:1,extraData:1,fixedClass:1,username:1},function(err,result) {
            if (err) {
                let date1 = new Date().toString();
                let logObject1 = {
                    date: date1.split(" GMT")[0],
                    classId: 0,
                    username: "err",
                    className: "err",
                    role: "teacher",
                    type: "Error", // Access - Command - Admin
                    data: "off",
                };
                Logs.create(logObject1);
            }
            if (result) {
                result.save();
                if(result.role === "superstudent"){
                    user.adminCommand({
                        body: {
                            classId: result.extraData.class.classId,
                            command: "close"
                        }
                    }, null,result, null); 
                   // update user , class
                   // log presence
                    classSchema.findOneAndUpdate({
                        id: result.extraData.class.id,
                    }, {$set: {situation: "close"}}, function (err, clas) {
                        if (err) {
                            let date1 = new Date().toString();
                            let logObject1 = {
                                date: date1.split(" GMT")[0],
                                classId: 0,
                                username: "admin",
                                className: "err",
                                role: "admin",
                                type: "Error", // Access - Command - Admin
                                data: "on class update",
                            };
                            Logs.create(logObject1);
                        }
                        else{
                            if (clas) {
                                res.send({result: true, command: "Off", data: clas});
                                let date = new Date().toString();
                                let logObject = {
                                    date: date.split(" GMT")[0],
                                    classId: clas.classId || 0,
                                    username: result.username,
                                    className: clas.name,
                                    role: "superstudent",
                                    type: "Command", // Access - Command - Admin
                                    data: "close",
                                };
                                Logs.create(logObject);
                                userSchema.findOneAndUpdate({loggedIn: true, role: "superstudent"}, {
                                    $set: {
                                        command: "F",
                                        loggedIn: false
                                    }
                                }, function (err, resx) {
                                    if (err) throw err;
                                    if (resx) {
                                        let date = new Date().toString();
                                        
                                        console.log("className : " + clas.name);
                                        let presentObject = {
                                            date: date.split(" GMT")[0],
                                            classId: clas.classId || 0,
                                            username: resx.username,
                                            className: clas.name,
                                            class_id: clas.id
                                        };
                                        Presents.create(presentObject);
                                    }
                                    else {
                                        let date = new Date().toString();
                                        let logObject = {
                                            date: date.split(" GMT")[0],
                                            classId: clas.classId || 0,
                                            username: clas.ostadUsername,
                                            className: clas.name,
                                            role: "superstudent",
                                            type: "Command", // Access - Command - Admin
                                            data: "close-error",
                                        };
                                        Logs.create(logObject);
                                    }
                                });
                                
                            }
                        }
                    });
                }
                else if (result.role === "teacher") {
                    let classId = result.extraData.class.classId;
                    let id = result.extraData.class.id;
                    let className = result.extraData.class.name;
                    if(result.extraData.class2){
                        if(parseInt(result.extraData.class2.classId) === parseInt(req.body.classId)){
                            classId = parseInt(result.extraData.class2.classId);
                            id = result.extraData.class2.id ;
                            className = result.extraData.class2.name
                        }
                    }
                    classSchema.findOneAndUpdate({
                        id:id,
                        classId: classId,
                        situation: "open"
                    }, {$set: {situation: "close"}}, function (err, cls) {
                        if (err) {
                            let date1 = new Date().toString();
                            let logObject1 = {
                                date: date1.split(" GMT")[0],
                                classId: 0,
                                username: "admin",
                                className: "err",
                                role: "admin",
                                type: "Error", // Access - Command - Admin
                                data: "off class update",
                            };
                            Logs.create(logObject1);
                        }
                        if (cls) {
                            classSchema.updateMany({
                                classId:  classId,
                            }, {$set: {situation: "close"}}, function (err, cls) {
                                if (err) {
                            }});
                            
                            let date = new Date().toString();
                            let logObject = {
                                date: date.split(" GMT")[0],
                                classId: classId || 0,
                                username: result.extraData.class.ostadUsername,
                                className: className,
                                role: result.role,
                                type: "Command", // Access - Command - Admin
                                data: "close",
                            };
                            Logs.create(logObject);
                            let now = new Date();
                            let hours = now.getHours();
                            let minutes = now.getMinutes();
                            let thisNow = (hours * 60) + minutes;
                            let thisRight = cls.right;
                            classSchema.findOne({
                                left: {$lte: thisRight + 10, $gte: thisRight - 15},
                                classId: classId
                            }, {name: 1, situation: 1}, function (err, clas) {
                                if (err) throw err;
                                if (clas) {
                                    // console.log(clas.situation.toString());
                                    if (clas.situation !== "open") {
                                        userSchema.update({loggedIn: true}, {
                                            $set: {
                                                command: "F",
                                                classId:classId,
                                                loggedIn: false
                                            }
                                        }, function (err, resx) {
                                            if (err) throw err;
                                            if (resx.n > 0) {
                                                let logObject = {
                                                    date: date.split(" GMT")[0],
                                                    classId: classId || 0,
                                                    username: result.username,
                                                    className: className,
                                                    role: "teacher",
                                                    type: "logout", // Access - Command - Admin
                                                    data: "before time",
                                                };
                                                Logs.create(logObject);
                                            }
                                            res.send({result: true, command: "Off", data: result});
                                        });
                                    }
                                    else {
                                        userSchema.update({loggedIn: true}, {
                                            $set: {
                                                command: "N",
																								classId:classId,
                                                loggedIn: false
                                            }
                                        }, function (err, resx) {
                                            if (err) throw err;
                                            if (resx.n > 0) {
                                                let logObject = {
                                                    date: date.split(" GMT")[0],
                                                    classId: classId || 0,
                                                    username: result.username,
                                                    className: className,
                                                    role: "teacher",
                                                    type: "logout", // Access - Command - Admin
                                                    data: "before time",
                                                };
                                                Logs.create(logObject);
                                            }
                                            res.send({
                                                result: true,
                                                command: "logged but not close",
                                                data: result
                                            });
                                        });
                                    }
                                }
                                else {
                                    userSchema.update({loggedIn: true}, {
                                        $set: {
                                            command: "F",
											classId:classId,
                                            loggedIn: false
                                        }
                                    }, function (err, resx) {
                                        if (err) throw err;
                                        if (resx.n > 0) {
                                            let logObject = {
                                                date: date.split(" GMT")[0],
                                                classId: result.extraData.class.classId || 0,
                                                username: result.username,
                                                className: result.extraData.class.name,
                                                role: "teacher",
                                                type: "logout", // Access - Command - Admin
                                                data: "before time",
                                            };
                                            Logs.create(logObject);
                                        }
                                        res.send({result: true, command: "Off", data: result});
                                    });
                                }
                            });
                        }
                    });
                }
                else{
                    res.send({result:false,message:"Students Do Not Access To Close The Dor (auto close up by timeout 45s )"})
                }
            }
            else{
                res.send({result:false,message:"System is busy try again please"});
            }
        });
    },
    adminCommand:function(req,res,usr,sys){
        if(!usr){
            usr = lastLoggedInAdmin;
        }
            if(WS!==null) {
            if (usr.role === "admin" || usr.role === "superuser")
                lastLoggedInAdmin = usr;
            let classId = req.body.classId || 0;
            let command = req.body.command || "";
            let tempCommand = command;
            if (classId !== 0 && !isNaN(classId) && (command === "open" || command === "close")) {
                if (command === "close") {
                    command = "F";
                }
                else if (command === "open") {
                    command = "O";
                }
                else {
                    if(res) {
                        res.send({result: false, message: "invalid command"})
                    }
                }
                WS.send((classId + command).toString(), function (ack) {
                    console.log(" ACK :::::: "  + ack);
                    let date = new Date().toString();
                    let logObject = {
                        date: date.split(" GMT")[0],
                        classId: classId || 0,
                        username: sys || usr.username,
                        className: "null",
                        role: "Admin",
                        type: "Command", // Access - Command - Admin
                        data: tempCommand,
                    };
                    Logs.create(logObject);
                    classSchema.updateMany(
                        {
                            classId: classId
                        },
                        {
                            $set: {
                                situation: tempCommand
                            }
                        }, function (err, resulx) {
                            if (err) throw err;
                            console.log(resulx);
                            if (resulx.n > 0) {
                                console.log(resulx);
                                console.log("updated class situation");
                            }
                            else {

                            }
                        });
                });
                if (res !== null) {
                    // admin command
                    res.send(true);
                }
                else {
                    // timeout command
                }
            }
            else {
                if (res !== null) {
                    res.send({result: false, message: "504 Bad request"});
                }
                else {
                    console.log("bad input");
                }
            }
        }
        else {
            if(res)
                res.send({result: false, message: "No connection to node red"});
        }
    },
    checkAdminCommand:function(req,res){
        // node red request every second
        userSchema.findOne({role:{$in:["admin","superuser","sabet"]},isCommand:true},
            {isCommand:1,fullName:1,role:1,adminCommand:1,username:1,userId:1},function(err,usr){
            if(err) res.send({result:false,message:"Oops something went wrong"});
            if(usr){
                userSchema.findOneAndUpdate(
                    {
                        username:usr.username
                    },
                    {
                        $set: {
                            adminCommand: [],
                            isCommand : false
                        }
                    },function(err,result){
                        if(err) {
                            var date1 = new Date().toString();
                            var logObject1 = {
                                date: date1.split(" GMT")[0],
                                classId: 0,
                                username: "err",
                                className: "err",
                                role: "tacher",
                                type: "Error", // Access - Command - Admin
                                data: "checkAdminCommand",
                            };
                            Logs.create(logObject1);
                        }

                    });
                let commandObject = usr.adminCommand;
                res.send(commandObject);
            }
            else{
                res.send({result:false,message:"No Admin Command Right Now"});
            }
        })
    },
    getLogs:function(req,res){
        let fields = ["date","username","role","classId","className","type","data"];
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
    getPresents:function(req,res){
        let fields = ["date","classId","username","className"];
        let now = Date.now();
        let query = {};
        let timex = req.body.timeEdge || 0;
        if(req.body.timeEdge){
            let timeEdge = timex * 24 * 3600000;
            timeEdge = Date.now() - timeEdge ;
            query.createdAt = {$gte:timeEdge}
        }

        presentSchema.find({$query: query, $orderBy: { createdAt : -1 }},function(err,prs){
            if(err) {
                let date1 = new Date().toString();
                let logObject1 = {
                    date: date1.split(" GMT")[0],
                    classId: 0,
                    username: "admin",
                    className: "err",
                    role: "admin",
                    type: "Error", // Access - Command - Admin
                    data: "getPresents",
                };
                Logs.create(logObject1);

                res.send({result:false,message:"Oops - failed to get Presents"});
            }

            if(prs.length>0) {

                let finalPresents = [];
                let addeds = {};
                for(let x = 0 ; x < prs.length ; x++) {
                    let splitedTime = prs[x].date.split(" ");
                    let uniqueDayTime = splitedTime[1]+"-"+splitedTime[2]+"-"+splitedTime[3];
                    if(!addeds[prs[x].class_id+"/"+prs[x].username+"/"+uniqueDayTime]) {
                        finalPresents.push(prs[x]);
                        addeds[prs[x].class_id + "/" + prs[x].username + "/" + uniqueDayTime] = true;
                    }
                    if(x === prs.length -1) {
                        console.log(addeds);
                        let csvData = json2csv({data: finalPresents, fields: fields});
                        fs.writeFile("/home/pi/SmartEntrance/logs/presents.csv", csvData, function (err) {
                            if (err) {
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
                                res.send({result: false, message: "err 1 presents"});
                            }
                            else {
                                fs.writeFile("/home/pi/SmartEntrance/logs/presents-" + now + ".csv", csvData, function (err2) {
                                    if (err2) {
                                        let date3 = new Date().toString();
                                        let logObject3 = {
                                            date: date3,
                                            classId: 0,
                                            username: "admin",
                                            className: "err",
                                            role: "admin",
                                            type: "Error", // Access - Command - Admin
                                            data: "getPresents - fs write 2",
                                        };
                                        Logs.create(logObject3);
                                        res.send({result: false, message: "err 2 presents"});
                                    }
                                    else {
                                        res.send("presents-" + now + ".csv");
                                    }
                                });
                            }
                        });
                    }
                }
            }
            else{
                res.send({result:false,message:"No logs found"});
            }
        });
    },
};



module.exports = user;
