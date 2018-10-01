const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const random = require('randomstring');

var presentSchema = new Schema({
    date: String,
    createdAt:Number,
    classId: Number,
    username: String,
    className: String,
    class_id : String
});


presentSchema.methods.create = function (presObject) {
    let now = Date.now();
    let timeEdge = now - (14*3600*1000); // 14 hours
    presents.findOne({class_id:presObject.class_id,username:presObject.username,createdAt:{$gt:timeEdge}},function(err,result){
        if(err) throw err;
        if(!result){
            var newPres = new Presents(presObject);
            newPres.createdAt = now;
            newPres.id = random.generate(32);
            newPres.save(function(err){
                if(err) console.log(err);
                console.log(newPres.class_id + " ... Present Logged ! " + newPres.username);
            });
        }
        else{
            console.log("Already Logged Present");
        }
    });
};


var Presents = mongoose.model('presents', presentSchema);
var presents = mongoose.model('presents');
module.exports = presents;