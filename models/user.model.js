const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const random = require('randomstring');

var userSchema = new Schema({
    username:String,
    password:String,
    userId : String,
    fullName : String,
    rfId:[],
    fingerPrint:[],
    sampling:Boolean,
    samplingType:String,
    loggedIn : Boolean,
    command:String,
    extraData : {},
    createdAt:Number,
    role:String, // student - teacher - admin - superuser
    updatedAt:Number,
    adminCommand:[],
    isCommand : Boolean,
});


userSchema.methods.create = function (req,res,userObject) {

    var newUser = new Users(userObject);
    newUser.createdAt = Date.now();
    newUser.save(function(err){
        if(err){

        }
        newUser.rfId = null;
        newUser.fingerPrint = null;
        if(res)
            res.send({result:true,value:newUser});
    });

};
userSchema.pre('save', function(next){
    if(this.updatedAt) {
        this.updatedAt = Date.now();
    }
    else{
        var now = Date.now();
        this.createdAt = now;
        this.updatedAt = now;
    }
    next();
});

var Users = mongoose.model('users', userSchema);
var users = mongoose.model('users');
module.exports = users;