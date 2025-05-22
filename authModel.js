const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
    email:{type: String, required: true},
    password:{type: String, required: true},
    firstName:{type: String, default: ""},
    lastName:{type: String, default: ""},
    state:{type: String, default: ""}
}, {timestamps: true});

const Auth = new mongoose.model("Auth", authSchema);

module.exports = Auth;