"use strict"
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const answer = new Schema({
    name : String,
    date : String,
    groupStudentID : Object
});

module.exports = mongoose.model("studentGroups", answer);