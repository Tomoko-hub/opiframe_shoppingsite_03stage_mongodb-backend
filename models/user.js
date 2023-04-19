const mongoose  = require("mongoose");

let Schema = mongoose.Schema({
    username:{type: String, uniq:true},
    password:String
})

module.expoerts = mongoose.model("User", Schema);