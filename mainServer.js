"use strict"
const express = require('express');
const app = express();
const url = require('url');
const path = require('path');
const port = process.env.port || 3000;
const upload = require('express-fileupload');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const ejs = require('ejs');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
var bodyParser = require("body-parser");
app.use(bodyParser());

//Connection to database
const  URLdatabase = "mongodb+srv://ICT302_UC:passexam@cluster0-zbjzo.mongodb.net/account_UC?retryWrites=true&w=majority";

mongoose.connect(URLdatabase, {
    useNewUrlParser : true,
    useUnifiedTopology : true
});

app.use(upload());
//call handle UC event 
const event = require("./handleEvent/UcEvent");
app.use("/UC" , event );

//call handle student event
const eventStudent = require("./handleEvent/studentEvent");
app.use("/student" , eventStudent );


app.use(express.static(path.join(__dirname , 'htmlPage')));

// test send email??
const studentTable = require('./handleEvent/schmeData/studentRecord');
const formStudent = require('./handleEvent/schmeData/formSurvey');


//main site 
app.get('/', function(req, res )
{
    res.sendFile(path.join(__dirname , "htmlPage/html/mainSite.html"));  
})

//about US site
app.get('/ABOUT%20US', function(req, res )
{
    res.sendFile(path.join(__dirname , "htmlPage/html/aboutUS.html"  ));
})



app.listen( port , function (err)
{
    if(err)
    {
        console.log("There is somethig went wrong");
    }
    else 
    {
        console.log("Listen on port" + port);
    }
})