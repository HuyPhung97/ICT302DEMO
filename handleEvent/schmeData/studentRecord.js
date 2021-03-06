"use strict"
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const student = new Schema({
    PersonId : String,
    Surname : String,
    Title : String,
    Givenames : String,
    teachPeriod : String,
    UnitCode : String,
    teamdID : String,
    email : String,
    formName: Array,
    status: Array,
    sendMail : Array,
    reminder : Array,
});

module.exports = mongoose.model("students", student);
  
