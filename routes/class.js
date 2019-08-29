var classSchema = require('../models/class.model');
var Classes = new classSchema();
var userSchema = require('../models/user.model');
var logSchema = require('../models/log.model');
var usersf = require('./user');
let extraLeft = 20;
let extraRight = 60;
var Logs = new logSchema();
const WebSocket = require('ws');

const wss = new WebSocket.Server({port:3002});
var WS = null;
wss.on('connection', function connection(ws) {
    WS = ws;
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
});
/* GET home page. */

var clas = {

    getAll: function(req, res,username,publicx,callback) {
        let query = {};
        if(publicx){
            query.isPublic = true
        }
        if(username ==="") {

            classSchema.find({$query:query, $orderBy: {left: -1}}, {
                classId: 1,
                name: 1,
                day: 1,
                id:1,
                ostadUsername: 1,
                left: 1,
                right: 1,
                leftDate: 1,
                accessProject:1,
                isPublic:1,
                studentsList:1,
                rightDate: 1
            }, function (err, classes) {
                if (err)
                    res.send({result: false, message: "Oops Something went wrong - please try again"});
                res.send(classes);
            });
        }
        else if(username === "Number"){
            console.log("Get numbered classes");
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

            classSchema.find({$query: {}, $orderBy: {classId: +1}}, {
                classId: 1,
                name: 1,
                day: 1,
                id:1,
                ostadUsername: 1,
                left: 1,
                right: 1,
                leftDate: 1,
                rightDate: 1,
                situation:1,
                accessProject:1,
                isPublic:1,
                studentsList:1
            }, function (err, classes) {
                if (err && res)
                    res.send({result: false, message: "Oops Something went wrong - please try again"});
                if(classes.length > 0) {
                    let classNumbers = [];
                    let numbers = [];
                    let emptys = [];
                    let thisLeft = (thisDay*24*60) + (thisHour*60) + thisMinute;
                    for (let x = 0; x < classes.length; x++) {
                        if (numbers.indexOf(classes[x].classId) === -1) {
                            if(classes[x].classId === 202){
                                numbers.push(classes[x].classId);
                                classNumbers.push({
                                    classId: classes[x].classId,
                                    situation: classes[x].situation,
                                    name: "Project Room",
                                    ostadUsername: "",
                                    leftDate: "",
                                    rightDate: ""
                                });
                            }
                            else{
                                if (classes[x].situation === "open") {
                                    numbers.push(classes[x].classId);
                                    if(((classes[x].right+(20*60*1000)) >= thisLeft) && ((classes[x].left-(20*60*1000)) < (thisLeft))){
                                            numbers.push(classes[x].classId);
                                            classNumbers.push({
                                                classId: classes[x].classId,
                                                situation: classes[x].situation,
                                                ostadUsername: classes[x].ostadUsername,
                                                name: classes[x].name,
                                                leftDate: classes[x].leftDate,
                                                rightDate: classes[x].rightDate
                                            });
                                            delete emptys.indexOf(classes[x].classId);
                                    }
                                    else{
                                        emptys.push(classes[x].classId);
                                        classNumbers.push({
                                            classId: classes[x].classId,
                                            situation: "close",
                                            name: "",
                                            ostadUsername: "",
                                            leftDate: "",
                                            rightDate: ""
                                        });
                                    }
                                }
                                else {
                                    if(emptys.indexOf(classes[x].classId) === -1){
                                        emptys.push(classes[x].classId);
                                        classNumbers.push({
                                            classId: classes[x].classId,
                                            situation: classes[x].situation,
                                            name: "",
                                            ostadUsername: "",
                                            leftDate: "",
                                            rightDate: ""
                                        });
                                    }
                                }
                            }
                        }
                        if (x === classes.length - 1) {
                            if(res)
                                res.send(classNumbers);
                            else
                                return callback(classNumbers);
                            console.log(classNumbers);
                        }
                    }
                }
                else{
                    res.send({result:false,message:" No Class defined "});
                }
            });
        }
        else {
            if(publicx){
                query.studentsList = {$in:[username]};
            }
            else{
                query.ostadUsername = username;
            }
            classSchema.find({$query: query,$orderBy: {updatedAt: -1}}, {
                classId: 1,
                name: 1,
                day: 1,
                id:1,
                ostadUsername: 1,
                left: 1,
                accessProject:1,
                right: 1,
                leftDate: 1,
                rightDate: 1,
                isPublic:1,
                studentsList:1
            }, function (err, classes) {
                if (err)
                    res.send({result: false, message: "Oops Something went wrong - please try again"});
                res.send(classes);
            });
        }
    },
    timeOutCloseCheck:function(){
        console.log("Timeout close check");
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
        let classesList = [];
        let thisRightNew = thisLeft - extraRight ; //
        classSchema.find({$query:{left:{$lt:thisLeft},right:{$gt:thisLeft}},$orderBy:{classId:-1}},{day:1,leftDate:1,rightDate:1,left:1,right:1,id:1,classId:1,name:1,situation:1,ostadUsername:1},function(err,clases) {
            if (!err && clases) {
                classesList.push(clases);
                console.log(clases);
                classSchema.find({
                    $query: {right: {$lte: thisLeft, $gt: thisRightNew}},
                    $orderBy: {classId: -1}
                }, {
                    day: 1,
                    leftDate: 1,
                    rightDate: 1,
                    left: 1,
                    right: 1,
                    id: 1,
                    classId: 1,
                    name: 1,
                    situation: 1,
                    accessProject:1,
                    ostadUsername: 1
                }, function (err, classesx) {
                    if (!err && classesx) {
                        classesList.push(classesx);
                        console.log(classesx);
                        let classesSituationMap = {};
                        if(clases.length >0) {
                            for (let x = 0; x < clases.length; x++) {
                                classesSituationMap[clases[x].classId] = clases[x].situation;
                                if (x === clases.length - 1) {
                                    for (let z = 0; z < classesx.length; z++) {
                                        if (!classesSituationMap[classesx[z].classId]) {
                                            if (classesx[z].situation === "open") {
                                                if (((thisLeft - classesx[z].right) >= 20) && ((thisLeft - classesx[z].right) <= 22)) {
                                                    setTimeout(function() {
                                                        let date = new Date().toString();
                                                        let logObject = {
                                                            date: date.split(" GMT")[0],
                                                            classId: classesx[z].classId || 0,
                                                            username: classesx[z].ostadUsername,
                                                            className: classesx[z].className,
                                                            role: "System",
                                                            type: "Command", // Access - Command - Admin
                                                            data: "timeout close",
                                                        };
                                                        clas.timeOutCommand({
                                                            body: {
                                                                classId: classesx[z].classId,
                                                                command: "close"
                                                            }
                                                        }, null, logObject);
                                                    },1000*z);
                                                }
                                            }
                                        }
                                        else {
                                            if (classesSituationMap[classesx[z].classId] === "close") {
                                                if (classesx[z].situation === "open") {
                                                    if (((thisLeft - classesx[z].right) >= 20) && ((thisLeft - classesx[z].right) <= 22)){
                                                        setTimeout(function() {
                                                            let date = new Date().toString();
                                                            let logObject = {
                                                                date: date.split(" GMT")[0],
                                                                classId: classesx[z].classId || 0,
                                                                username: classesx[z].ostadUsername,
                                                                className: classesx[z].className,
                                                                role: "System",
                                                                type: "Command", // Access - Command - Admin
                                                                data: "timeout close",
                                                            };
                                                            clas.timeOutCommand({
                                                                body: {
                                                                    classId: classesx[z].classId,
                                                                    command: "close",

                                                                }
                                                            }, null, logObject);
                                                        },1000*z);
                                                    }
                                                }
                                            }
                                            else {
                                                console.log("Nex Class Already begun no need to timeout close");
                                            }
                                        }
                                        if (z === classesx.length - 1) {
                                            console.log("DONE FOR");
                                        }
                                    }
                                }
                            }
                        }
                        else{
                            if(classesx.length >0) {
                                for (let z = 0; z < classesx.length; z++) {
                                    if (classesx[z].situation === "open") {
                                        if (((thisLeft - classesx[z].right) >= 20) && ((thisLeft - classesx[z].right) <= 22)){
                                            setTimeout(function(){
                                                console.log("XXXXXXXXXXXXXX - timeout close Done !");
                                                let date = new Date().toString();
                                                let logObject = {
                                                    date: date.split(" GMT")[0],
                                                    classId: classesx[z].classId || 0,
                                                    username: classesx[z].ostadUsername,
                                                    className: classesx[z].className,
                                                    role: "System",
                                                    type: "Command", // Access - Command - Admin
                                                    data: "timeout close",
                                                };
                                                clas.timeOutCommand({
                                                    body: {
                                                        classId: classesx[z].classId,
                                                        command: "close"
                                                    }
                                                }, null, logObject);
                                            },1000*z);
                                        }
                                    }
                                }
                            }
                            else{
                                //
                            }
                        }
                    }
                    else{
                        console.log("timeout Err up to 15 minutes past Classes")
                    }
                });
            }
            else{
                console.log("timeout Err find Now Classes");
            }
        });
    },
    getNowClasses:function(req,res){
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
        let classesList = [];
        let thisLeftNew = thisLeft + extraLeft; //
        let thisRightNew = thisLeft - (extraRight - 40); //

        let thisLeftAll = (8*24*60) + (thisHour*60) + thisMinute;

        classSchema.find({$query:{left:{$lt:thisLeft},right:{$gt:thisLeft},classId:{$ne:202}},$orderBy:{classId:-1}},{day:1,leftDate:1,rightDate:1,left:1,right:1,id:1,classId:1,accessProject:1,name:1,situation:1,ostadUsername:1,isPublic:1,studentsList:1},function(err1,classes1) {
            if (err1)
                res.send({result: false, message: "Oops Something went wrong - please try again1"});
            classesList.push(classes1);
            classSchema.find({$query:{left:{$lt:thisLeftNew,$gte:thisLeft},classId:{$ne:202}},$orderBy:{classId:-1}},{day:1,leftDate:1,rightDate:1,accessProject:1,left:1,right:1,id:1,classId:1,name:1,situation:1,ostadUsername:1,isPublic:1,studentsList:1},function(err2,classes2) {
                if (err2)
                    res.send({result: false, message: "Oops Something went wrong - please try again2"});
                classesList.push(classes2);
                classSchema.find({$query:{right:{$lte:thisLeft,$gt:thisRightNew},classId:{$ne:202}},$orderBy:{classId:-1}},{day:1,leftDate:1,rightDate:1,left:1,accessProject:1,right:1,id:1,classId:1,name:1,situation:1,ostadUsername:1,isPublic:1,studentsList:1},function(err3,classes3) {
                    if (err3)
                        res.send({result: false, message: "Oops Something went wrong - please try again3"});
                    classesList.push(classes3);
                    classSchema.find({$query:{left:{$lt:thisLeftAll},right:{$gt:thisLeftAll}},classId:{$ne:202},$orderBy:{classId:-1}},{day:1,leftDate:1,rightDate:1,left:1,accessProject:1,right:1,id:1,classId:1,name:1,situation:1,ostadUsername:1,isPublic:1,studentsList:1},function(err4,classes4) {
                        if (err4)
                            res.send({result: false, message: "Oops Something went wrong - please try again4"});
                        classesList.push(classes4);
                        classSchema.find({$query:{classId:202}},{classId:1,name:1,situation:1,id:1,ostadUsername:1},function(err5,classes5) {
                            if (err5)
                                res.send({result: false, message: "Oops Something went wrong - please try again4"});
                            classesList.push(classes5);
                            res.send(classesList);
                        });
                    });
                });
            });
        });
    },
    getInfo: function(req, res,id) {
        classSchema.findOne({id:id},{classId:1,id:1,name:1,day:1,ostadUsername:1,situation:1,rightDate:1,leftDate:1,accessProject:1,left:1,right:1,isPublic:1,studentsList:1},function(err,clas) {
            if (err)
                res.send({result: false, message: "Oops Something went wrong - please try again"});
            if(clas)
                res.send(clas);
            else
                res.send({result: false, message: " No Class Found "});

        });
    },
    clearDayClasses:function() {
        console.log("Timeout close check");
        let now = new Date();
        let thisTime = now.toString().split(" ");
        let thisDay = thisTime[0];
        switch (thisDay) {
            case"Sat": {
                thisDay = 1;
            }
                break;
            case"Sun": {
                thisDay = 2;
            }
                break;
            case"Mon": {
                thisDay = 3;
            }
                break;
            case"Tue": {
                thisDay = 4;
            }
                break;
            case"Wed": {
                thisDay = 5;
            }
                break;
            case"Thu": {
                thisDay = 6;
            }
                break;
            case"Fri": {
                thisDay = 7;
            }
                break;
        }
        clas.getAll(null, null,"Number",undefined,function(callback){
            let definedClasses = callback;
            for(let x = 0 ; x < definedClasses.length ; x++){
                setTimeout(function() {
                    clas.timeOutCommand({
                        body: {
                            classId: definedClasses[x].classId,
                            command: "close"
                        }
                    }, null, null);
                },1500*x);
            }
        });


    },
    register: function(req, res) {

        let thisDay = req.body.day;
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
            case"All":{
                thisDay = 8;
            }break;
        }
        console.log(req.body.leftHour);
        let thisHour = parseInt(req.body.leftHour);
        let thisMinute = parseInt(req.body.leftMinute);
        let classId = parseInt(req.body.classId);
        if(classId === 202){
            classSchema.findOne({classId:classId},function(err,result){
                if(result){
                    res.send({result:false,message:"Cant set a full time class on Project Room"});
                }
                else{
                    let classObject = {
                        name: "Project Room",
                        classId: classId,
                        day: "All",
                        left: -1,
                        right: -1,
                        situation: "close",
                        leftDate: null,
                        rightDate: null,
                        ostadUsername: ""

                    };
                    Classes.create(req, res, classObject);
                }
            });
        }
        else {

            let thisLeft = (thisDay * 24 * 60) + (parseInt(thisHour) * 60) + parseInt(thisMinute);
            let thisRight = (thisDay * 24 * 60) + (parseInt(req.body.rightHour) * 60) + parseInt(req.body.rightMinute);
            let accessProject = parseInt(req.body.project) || null;
            let isPublic = req.body.isPublic || false;
            if (((!isNaN(req.body.classId)) && (req.body.name !== "")) && (accessProject === null ||((typeof accessProject === "number") && (accessProject === 202)))) { // For Now
                classSchema.findOne({
                        classId: req.body.classId, day: req.body.day, $or: [
                            {left: {$lt: thisLeft}, right: {$gt: thisLeft}},
                            {left: {$lt: thisRight}, right: {$gte: thisRight}},
                        ]
                    }
                    , function (err, cls) {
                        if (err) {
                            res.send({result: false, message: "Oops Something went wrong - please try again1"});
                        }
                        else if (cls && cls.id !== req.body.id) {
                            res.send({
                                result: false,
                                message: "Class is taken -> " + req.body.classId + " Congestion with ... " + cls.name + " :: " + cls.day + " - " + cls.leftDate.hour + ":" + cls.leftDate.minute + " / " + cls.rightDate.hour + ":" + cls.rightDate.minute
                            });
                        }
                        else {
                            classSchema.findOne({
                                day: req.body.day, $or: [{
                                    left:
                                        {$lte: thisLeft},
                                    right:
                                        {$gt: thisLeft}
                                },
                                    {
                                        left:
                                            {$lte: thisRight},
                                        right:
                                            {$gt: thisRight}
                                    }
                                ],
                                ostadUsername: req.body.username
                            }, {
                                name: 1,
                                classId: 1,
                                ostadUsername: 1,
                                day: 1,
                                leftDate: 1,
                                rightDate: 1
                            }, function (err, cls) {
                                if (err)
                                    res.send({result: false, message: "Oops Something went wrong - please try again2"});
                                if (cls) {
                                    res.send({
                                        result: false,
                                        message: "Ostad is Busy -> " + req.body.classId + " Congestion with ... " + req.body.username + cls.name + " " + cls.day + " - " + cls.leftDate.hour + ":" + cls.leftDate.minute + " / " + cls.rightDate.hour + ":" + cls.rightDate.minute
                                    });
                                }
                                else {
                                    let classObject = {
                                        name: req.body.name,
                                        classId: req.body.classId,
                                        day: req.body.day,
                                        left: thisLeft,
                                        right: thisRight,
                                        situation: "close",
                                        leftDate: {
                                            hour: req.body.leftHour,
                                            minute: req.body.leftMinute,
                                        },
                                        rightDate: {
                                            hour: req.body.rightHour,
                                            minute: req.body.rightMinute,
                                        },
                                        ostadUsername: req.body.username,
                                        accessProject: accessProject || null,
                                        isPublic : isPublic

                                    };
                                    Classes.create(req, res, classObject);

                                    let date = new Date().toString();
                                    let logObject = {
                                        date: date.split(" GMT")[0],
                                        classId: req.body.classId,
                                        username: req.body.ostadUsername,
                                        className: req.body.className,
                                        role: "Admin",
                                        type: "Admin", // Access - Command - Admin
                                        data: "Create",
                                    };
                                    Logs.create(logObject);
                                }
                            });
                        }
                    });
            }
            else {
                res.send({result: false, message: "Bad input"});
            }
        }
    },
    edit: function(req, res) {
        var now = new Date();
        var thisTime = now.toString().split(" ");
        var thisDay = req.body.day;
        var requestDate =  thisTime[1] + " - " + thisTime[2] + " - " + thisTime[3];
        console.log(requestDate + "\n" + req.body.username + "\n");
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
            case"All":{
                thisDay = 8;
            }break;
        }
        console.log(req.body.leftHour);
        let thisHour = parseInt(req.body.leftHour);
        let thisMinute = parseInt(req.body.leftMinute);

        let thisLeft = (thisDay*24*60) + (parseInt(thisHour)*60) + parseInt(thisMinute);
        let thisRight = (thisDay*24*60) +  (parseInt(req.body.rightHour)*60) + parseInt(req.body.rightMinute);
        let accessProject = parseInt(req.body.project) || null;
        let isPublic = req.body.isPublic || false;
        classSchema.findOne({
                        classId: req.body.classId, day: req.body.day, $or: [
                            {left: {$lt: thisLeft}, right: {$gt: thisLeft}},
                            {left: {$lt: thisRight}, right: {$gte: thisRight}},
                        ]
                    }
            ,function (err, cls) {
            if(err)
                res.send({result:false,message:"Oops Something went wrong - please try again1"});
            if(cls && cls.id !== req.body.id){
                res.send({
                    result: false,
                    message: "Class is taken -> " + req.body.classId+ " Congestion with ... " + cls.name + " :: " + cls.day + " - " + cls.leftDate.hour + ":" + cls.leftDate.minute + " / " + cls.rightDate.hour + ":" + cls.rightDate.minute
                });
            }
            else {

                classSchema.findOne({
                    day:req.body.day,$or:[
                        {
                            left:
                                {$lte:thisLeft},
                            right:
                                {$gt:thisLeft}
                        },
                        {
                            left:
                                {$lte:thisRight},
                            right:
                                {$gt:thisRight}
                        }
                    ],
                    ostadUsername : req.body.ostadUsername,
                    ostadFullName : req.body.ostadFullName,
                }, {
                    name: 1,
                    classId: 1,
                    id:1,
                    ostadUsername: 1,
                    leftDate:1,
                    left:1,
                    right:1,
                    hour:1,
                    day:1,
                    rightDate:1,
                    isPublic:1,
                    studentsList:1,
                    accessProject:1,


                }, function (err, cls) {
                    if (err)
                        res.send({result: false, message: "Oops Something went wrong - please try again2"});
                    if(cls && cls.id !== req.body.id){
                        res.send({
                            result: false,
                            message: "Ostad is Busy -> " + req.body.classId + " Congestion with ... " + cls.name + " " +  cls.day + " - " + cls.leftDate.hour + ":" + cls.leftDate.minute + " / " + cls.rightDate.hour + ":" + cls.rightDate.minute
                        });
                    }
                    else {
                        console.log(req.body.ostadUsername);
                        if (!isNaN(req.body.classId) && req.body.name !== "") {
                            classSchema.findOneAndUpdate({
                                id: req.body.id,
                            },
                            {
                                $set: {
                                    name: req.body.name,
                                    classId: req.body.classId,
                                    day: req.body.day,
                                    left: thisLeft,
                                    right: thisRight,
                                    accessProject: accessProject || null,
                                    isPublic : isPublic,
                                    leftDate: {
                                        hour: req.body.leftHour,
                                        minute: req.body.leftMinute
                                    },
                                    rightDate: {
                                        hour: req.body.rightHour,
                                        minute: req.body.rightMinute
                                    },
                                }
                            }, function (err, result) {
                                if (err) console.log(err);
                                else {
                                    res.send(result);
                                    var date = new Date().toString();
                                    var logObject = {
                                        date: date.split(" GMT")[0],
                                        classId: req.body.classId,
                                        username: req.body.ostadUsername,
                                        className: req.body.className,
                                        role: "Admin",
                                        type: "Admin", // Access - Command - Admin
                                        data: "Edit",
                                    };
                                    Logs.create(logObject);
                                }
                            });
                        }
                    }
                });
            }
        });
    },
    assignStudentToPublicClass : function(req,res){
        classSchema.update({
            id: req.body.classId,
            isPublic : true
        },
        {
            $addToSet: {
                studentsList: req.body.username,
            }
        }, function (err, result) {
            if (err) console.log(err);
            else {
                res.send(true);
                let date = new Date().toString();
                console.log(result);
                let logObject = {
                    date: date.split(" GMT")[0],
                    classId: result.classId,
                    username: result.ostadUsername,
                    className: req.body.className,
                    role: "Admin",
                    type: "define", // Access - Command - Admin
                    data: "assign student : " + req.body.username,
                };
                Logs.create(logObject);
            }
        });

    },
    removeStudentFromPublicClass : function(req,res){
        classSchema.update({
            id: req.body.classId,
            isPublic : true
        },
        {
            $pull: {
                studentsList: req.body.username,
            }
        }, function (err, result) {
            if (err) console.log(err);
            else {
                res.send(true);
                let date = new Date().toString();
                console.log(result);
                let logObject = {
                    date: date.split(" GMT")[0],
                    classId: result.classId,
                    username: result.ostadUsername,
                    className: result.className,
                    role: "Admin",
                    type: "define", // Access - Command - Admin
                    data: "remove student : " + req.body.username,
                };
                Logs.create(logObject);
            }
        });
    },
    delete: function(req,res,id) {
        if(req.body){
            id = req.body.id;
        }
        classSchema.findOneAndRemove({id : id},function(err,result){
            if(err) {
                console.log(err);
                if(res)
                    res.send({result:false,message:err});
                else{
                    console.log({result:false,message:err});
                }
            }
            if(result) {
                console.log(result);
                let date = new Date().toString();
                let logObject = {
                    date: date.split(" GMT")[0],
                    classId:0,
                    username: "Admin",
                    className:id || req.body.id,
                    role: "Admin",
                    type: "Admin", // Access - Command - Admin
                    data: "Delete",
                };
                Logs.create(logObject);
                if(res)
                    res.send(true);
                else{
                    console.log(true);
                }
            }
        });
    },
    timeOutCommand:function(req,res,logObject){
        if(WS!==null) {

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
    search:function(req,res){
        let classId = req.body.classId || null;
        if(classId) {
            classId = parseInt(classId);
        }
        let day = req.body.day || "";
        console.log(classId + " --- " + day);
        if(!classId || isNaN(classId) || (classId===0)){
            classId = {$exists:true};
        }
        if(day === ""){
            day = {$exists:true};
        }
        let query = {$and:[{classId:classId},{day:day}]};
        console.log("class search query : \n");
        console.log(query);
        classSchema.find({$query:query,$orderBy:{left:1}},{
            classId: 1,
            name: 1,
            day: 1,
            id:1,
            ostadUsername: 1,
            left: 1,
            right: 1,
            leftDate: 1,
            accessProject:1,
            rightDate: 1,
            situation : 1,
            isPublic:1,
            studentsList:1
            },
            function(err,classes){
                if(err) console.log(err);
                res.send(classes);
        });
    },
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
};

module.exports = clas;
