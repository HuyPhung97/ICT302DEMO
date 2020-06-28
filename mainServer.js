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
    sendEmail();
})

//about US site
app.get('/ABOUT%20US', function(req, res )
{
    res.sendFile(path.join(__dirname , "htmlPage/html/aboutUS.html"  ));
})

//handle send email 
var email ;
function sendEmail()
{
    console.log(req);
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'demoICT302@gmail.com',
          pass: 'passExam'
        }
      });

    var dataFormMongoDb = mongoose.model('students',  studentTable.Schema);

    dataFormMongoDb.find(function(err , data )
    {
        for(let i = 0 ; i < data.length ; i++)
        {
            if(data[i].status == "No")
            {
                var fromFromMongoDb = mongoose.model('formstudent', formStudent.Schema);

                fromFromMongoDb.find( { unitCode : data[i].UnitCode , teachPer : data[i].teachPeriod }, function (err , form)
                {
                    var current = getDate();
                    for(var j = 0  ; j < form.length ; j++)
                    {
                        var deadline = Date.parse(form[j].deadline);
                        var currentDate = Date.parse(current);   
                        
                        var diffDays = parseInt((deadline - currentDate) / (1000 * 60 * 60 * 24), 10); 
                        
                        if(diffDays < 7 && data[i].sendEmail == "No")
                        {
                             var content = `<a href="http://`+ICT302-TMA-FT04.ad.murdoch.edu.au+":"+port+"/student/id="+data[i].PersonId+`"> Click here to complete the form </a>`;
                            var mailOptions = {
                                from: 'demoICT302@gmail.com',
                                to: data[i].email,
                                subject: 'Sending Email to complete form!!!!',
                                text: "Please fill up the form",
                                html : content
                                
                            };

                            transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                  console.log(error);
                                } else {
                                  console.log('Email sent: ' + info.response);
                                  dataFormMongoDb.findOneAndUpdate({PersonId : data[i].PersonId}, { sendEmail : "Yes"} , function(err ,newData)
                                  {
                                        if(!err)
                                        {
                                            newData.save(function (err)
                                            {
                                                if(err)
                                                {
                                                    console.log("Error at send email update status!!!!");
                                                }
                                            })
                                        }
                                  })
                                }
                              });
                        }
                    }
                })
            }
        }
    })

    email = setTimeout(function()
    { sendEmail(); }, 3000);
}

function getDate()
{
    var d = new Date();
    var month = d.getMonth();
    var day = d.getDate();
    var year = d.getFullYear();
    month = parseInt(month) + 1;
    if(month < 10)
    {
        month = "0" + month;
    }
    if(day < 10)
    {
        day = "0" + day;
    }
    var fulldate = year+"-"+month+"-"+day;

    return fulldate;
}


// start server 
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