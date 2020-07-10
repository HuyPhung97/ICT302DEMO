"use strict"
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const answer = new Schema({
    PersonId : String,
    Surname : String,
    UnitCode : String,
    teachPeriod : String,
    teamdID : String,
    formName : String,
    Answer : Object
});

module.exports = mongoose.model("recordAnswer", answer);
  
