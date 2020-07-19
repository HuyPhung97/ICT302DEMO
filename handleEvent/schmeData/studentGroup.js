"use strict"
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const answer = new Schema({
    name : String,
    date : String,
    groupStudentID : Array,
});

module.exports = mongoose.model("studentGroups", answer);