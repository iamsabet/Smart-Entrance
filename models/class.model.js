const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const random = require('randomstring');
var classSchema = new Schema({
    name:String,
    classId : Number,
    id:String,
    day : String,
    left : Number,
    right : Number,
    leftDate:{
        hour:Number,
        minute:Number
    },
    rightDate:{
        hour:Number,
        minute:Number
    },
    createdAt:Number,
    accessProject : Number, // 202 , null if empty
    isPublic : Boolean,
    ostadUsername:String,
    studentsList : [],
    ostadFullName : String,
    updatedAt:Number,
    situation:String, // open - closed - canceled - not opened yet
});


classSchema.methods.create = function (req,res,userObject) {

    var newClass = new Classes(userObject);
    newClass.createdAt = Date.now();
    newClass.id = random.generate(16);
    newClass.save(function(err){
        if(err) console.log(err);
        res.send(newClass);
    });

};
classSchema.pre('save', function(next){
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

var Classes = mongoose.model('classes', classSchema);
var clas = mongoose.model('classes');
module.exports = clas;