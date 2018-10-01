var express = require('express');
var router = express.Router();
var users = require('./user');
var classes = require('./class');
var validateRequest = require("../middleWares/validateRequest");
var auth = require('./auth');


router.get('/', function(req, res) {
    validateRequest(req,res,function (callback) {
        if(callback){
            if(callback.role==="sabet" || callback.role==="superuser"){
                res.redirect("/superuser");
            }
            else{
                res.redirect("/admin");
            }
        }
        else {
            res.render("login.html");
        }
    });
});
router.get('/admin', function(req, res) {
    validateRequest(req,res,function (callback) {
        console.log(callback);
        if(callback){
            res.render("admin.html");
        }
        else {
            res.redirect("/login");
        }
    });
});
router.get('/superuser', function(req, res) {
    validateRequest(req,res,function (callback) {
        if(callback && (callback.role ==="sabet" || callback.role === "superuser")){
            res.render("superuser.html");
        }
        else {
            res.redirect("/login");
        }
    });
});

router.get('/login', function(req,res){
    validateRequest(req,res,function (callback) {
        if(callback){
            if(callback.role==="sabet" || callback.role==="superuser"){
                res.redirect("/superuser");
            }
            else{
                res.redirect("/admin");
            }
        }
        else {
            res.render("login.html");
        }
    });
});

router.get('/client', function(req, res) {
    res.render('client.html');
});


router.get('/client/getUsers', function(req, res) {
    users.getAll(req,res);
});


router.get('/admin/getUserInfo/:uuid', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            users.getInfo(req,res,req.params.uuid);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});

router.get('/admin/getClasses/', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            classes.getAll(req,res,"");
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});

router.get('/admin/getClasses/:uuid', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            classes.getAll(req,res,req.params.uuid);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});

router.get('/admin/getPublicClasses/', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            classes.getAll(req,res,"",true);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});

router.get('/admin/getPublicClasses/:uuid', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            classes.getAll(req,res,req.params.uuid,true);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});

router.get('/admin/getClassInfo/:uuid', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            classes.getInfo(req,res,req.params.uuid);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});
router.get('/client/getNumberClasses', function(req, res) {

    classes.getAll(req,res,"Number");

});
router.get('/admin/getNumberClasses', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            classes.getAll(req,res,"Number");
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});
router.post('/admin/getLogs', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            users.getLogs(req,res);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});

router.post('/admin/getPresents', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            users.getPresents(req,res);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});





router.post('/admin/login', auth.login);
router.post('/admin/addUser', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            users.register(req, res, callback);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});
router.post('/admin/addClass', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            classes.register(req,res);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});

router.post('/admin/editUser', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            users.edit(req,res);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});
router.post('/admin/editClass', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            classes.edit(req,res);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});

router.post('/admin/deleteUser', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            users.delete(req,res,req.body.id);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});
router.post('/admin/deleteClass', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            classes.delete(req,res,req.body.id);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});
router.post('/admin/assignStudent', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            classes.assignStudentToPublicClass(req,res);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});
router.post('/admin/removeStudent', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            classes.removeStudentFromPublicClass(req,res);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});
router.post('/admin/takeSampleState', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            users.SampleState(req,res);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});
router.post('/client/takeSampleState', function(req, res) {
    users.SampleState(req,res);
});
router.post('/admin/searchUsers', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            users.search(req,res);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});
router.post('/admin/classifiedClasses', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            classes.search(req,res);
        }
        else{
            res.send({result:false,message:"Oops"});
        }
    });
});

router.post('/client/adminCommand', function(req, res) {
    users.getAdmin(function(callback) {
        if(callback) {
            users.adminCommand(req, res, callback);
        }
        else{
            res.send({result:false,message:"No Admin found"});
        }
    });
});

router.post('/admin/adminCommand', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback) {
            users.adminCommand(req, res, callback);
        }
        else{
            res.send({result:false,message:"Oopsssss :))"});
        }
    });
});






router.get('/client/checkAdminCommand', function(req, res) {

    users.checkAdminCommand(req, res);

});
router.get('/client/checkAdminCommand', function(req, res) {
    users.checkAdminCommand(req, res);
});
router.get('/client/getNowClasses', function(req, res) {
    classes.getNowClasses(req,res);
});
router.post('/client/takeSample', function(req, res) {
    users.takeSample(req,res);
});
router.post('/client/checkAuth', function(req, res) {
    users.checkAuth(req,res);
});
router.post('/client/logout', function(req, res) {
    users.logout(req,res);
});
router.post('/client/onCommand', function(req, res) {
    users.on(req,res);
});
router.post('/client/offCommand', function(req, res) {
    users.off(req,res);
});







router.post('/superuser/registerAdmin', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback && callback.role === "superuser") {
            users.registerAdmin(req, res);
        }
        else{
            res.send({result:false,message:"403 Forbidden"})
        }
    });
});
router.get('/superuser/getAdmins', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback && callback.role === "superuser") {
            users.getAllAdmins(req, res);
        }
        else{
            res.send({result:false,message:"403 Forbidden"})
        }
    });
});

module.exports = router;
