const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const random = require('randomstring');
var logSchema = new Schema({
    id : String,
    date : String,
    createdAt : Number,
    classId : Number,
    username: String,
    className: String,
    role : String,
    userId : String,
    type : String, // Access - Command - Admin
    data : String//  Authorized - Not Authorized - Authenticated But not Authorized //  "Open" , "Close" , "timeout" // create // edit // remove //
});


logSchema.methods.create = function (logObject) {

    var newLog = new Logs(logObject);
    newLog.createdAt = Date.now();
    newLog.id = random.generate(32);
    newLog.save(function(err){
        if(err) console.log(err);
        console.log(newLog.id + " ... Logged !");
    });

};
logSchema.pre('save', function(next){
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

var Logs = mongoose.model('logs', logSchema);
var logs = mongoose.model('logs');
module.exports = logs;