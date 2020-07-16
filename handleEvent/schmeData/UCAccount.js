"use strict"
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UCRecord = new Schema({
    id : String,
    pwd : String,
});

module.exports = mongoose.model("accountucs", UCRecord);
  