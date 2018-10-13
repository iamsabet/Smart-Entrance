var express = require('express');
var router = express.Router();
var users = require('./user');
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

router.post('/client/takeSample', function(req, res) {
    users.takeSample(req,res);
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
router.get('/admin/getUsers', function(req, res) {
    validateRequest(req,res,function(callback) {
        if(callback && (callback.role === "admin" || callback.role === "superuser")){
            users.getAll(req, res);
        }
        else{
            res.send({result:false,message:"403 Forbidden"})
        }
    });
});

module.exports = router;
