"use strict"
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formRecord = new Schema({
    title : String,
    unitCode : String,
    teamdID : String,
    teachPer : String,
    deadline : String,
    question : Object

});

module.exports = mongoose.model("formstudent", formRecord);
  