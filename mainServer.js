"use strict"
const express = require('express');
const app = express();
const url = require('url');
const path = require('path');
const port = process.env.port || 3000;
const upload = require('express-fileupload');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var bodyParser = require("body-parser");
app.use(bodyParser());
const ejs = require('ejs');
app.engine('html', require('ejs').renderFile);

//app.set('views', 'htmlPage');


 //app.set('views', path.join(__dirname , 'htmlPage'));
//Connection to database
const localhost = 'mongodb://localhost:27017/Data_Server';
const  URLdatabase = "mongodb+srv://ICT302_UC:passexam@cluster0-zbjzo.mongodb.net/account_UC?retryWrites=true&w=majority" || localhost;


mongoose.connect(URLdatabase, {
    useNewUrlParser : true,
    useUnifiedTopology : true
});

mongoose.connection.on('connected' , function(err)
{
    if(err)
    {
        console.log("Fail to connect mongodb");
    }
    else 
    {
        console.log("Send email site have connect successful!!!");
    }
})

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
const UCrecord = require('./handleEvent/schmeData/UCAccount');

//main site 
app.get('/', function(req, res )
{
    res.sendFile(path.join(__dirname , "htmlPage/html/mainSite.html")); 
})


app.post('/', function(req, res )
{
    var UCAccount =  mongoose.model('accountucs', UCrecord.Schema);
    var find = 
    {
        id : req.body.uname,
        pwd : req.body.psw,
    }
   
    UCAccount.find(find , function(err ,data)
    {
        if(data.length == 0)
        {
            res.sendFile(path.join(__dirname , "htmlPage/html/mainSite.html")); 
            res.render(path.join(__dirname , "htmlPage/html/mainSite.html"), { invalid : "none"});
        }
        else 
        {
            res.redirect("/UC");
        }
    })
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
    var transporter = nodemailer.createTransport({
        secure: true,
        pool: true, 
        service: 'gmail',
        auth: {
          user: 'demoict302@gmail.com',
          pass: 'passExam'
        }
      });

    var dataFormMongoDb = mongoose.model('students',  studentTable.Schema);
    var formFromMongoDb = mongoose.model('formstudent',  formStudent.Schema);

    dataFormMongoDb.find(function(err , data )
    {
        if(data.length > 0)
        {
            for(let i = 0 ; i < data.length ; i++)
            {
                if(data[i].formName.length > 0)
                {
                    for(var j = 0 ; j < data[i].formName.length ; j++)
                    {
                        if(data[i].status[j] == "No")
                        {
                            var findData = 
                            {
                                title : data[i].formName[j], 
                                unitCode : data[i].UnitCode,
                                teachPer : data[i].teachPeriod
                            }
                            
                            let tempo = j;
                            let formName = data[i].formName[j];
                            let remider = data[i].reminder[j];
                            let sendEmail = data[i].sendMail[j];

                            formFromMongoDb.find( findData , function (err , form)
                            {
                                var current = getDate();
                                var deadline = Date.parse(form[0].deadline);
                                var currentDate = Date.parse(current);   
                                var diffDays = parseInt((deadline - currentDate) / (1000 * 60 * 60 * 24), 10); 
                                var hashValue =  Buffer.from(data[i].PersonId, "binary").toString("base64") ;
                               
                                if(sendEmail == "No" && diffDays < 7)
                                {
                                   var content = `
                                    <p> Dear Student, please click the link below to access and complete your personal Self and Peer Evaluation form.</p> 
                                    <br> <a href="http://ICT302-TMA-FT04.ad.murdoch.edu.au:`+port+`/student/id=`+hashValue+`/form=`+formName+`"> Click here to complete the form </a>`;
                                    
                                    var mailOptions = 
                                    {
                                        from: 'demoICT302@gmail.com',
                                        to: data[i].email,
                                        subject: 'Murdoch SPE Form',
                                        text: "Please fill up the form",
                                        html : content
                                    }

                                    transporter.sendMail(mailOptions, function(error, info)
                                    {
                                        if (error)
                                        {
                                            console.log(error);
                                        } 
                                        else
                                        {
                                            console.log('Email sent to : ' + data[i].email);
                                            data[i].sendMail[tempo] ="Yes";
                                            dataFormMongoDb.findOneAndUpdate({ PersonId : data[i].PersonId }, { sendMail : data[i].sendMail } , function(err ,statusEmail)
                                            {
                                                if(!err)
                                                {
                                                    statusEmail.save(function(err)
                                                    {
                                                        if(err)
                                                        {
                                                            console.log("Error at send email!!!!");
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })	 
                                } 

                                if(remider == "No"  && diffDays == 1)
                                {
                                    var content = `
                                        <p> Dear Student, this is the reminder to fill up the form </p> <p> please click the link below to access and complete your personal Self and Peer Evaluation form.</p> 
                                        <br> <a href="http://ICT302-TMA-FT04.ad.murdoch.edu.au:`+port+`/student/id=`+hashValue+`/form=`+formName+`"> Click here to complete the form </a>`;
                                       
                                    var mailOptions = 
                                    {
                                        from: 'demoICT302@gmail.com',
                                        to: data[i].email,
                                        subject: 'Murdoch SPE Form Reminder',
                                        text: "Please fill up the form",
                                        html : content
                                    }

                                    transporter.sendMail(mailOptions, function(error, info)
                                    {
                                        if (error)
                                        {
                                            console.log(error);
                                        } 
                                        else
                                        {
                                            console.log('Email sent to : ' + data[i].email);
                                            data[i].reminder[tempo] ="Yes";
                                            dataFormMongoDb.findOneAndUpdate({ PersonId : data[i].PersonId }, { reminder : data[i].reminder } , function(err ,statusEmail)
                                            {
                                                if(!err)
                                                {
                                                    statusEmail.save(function(err)
                                                    {
                                                        if(err)
                                                        {
                                                            console.log("Error at send email!!!!");
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })	 
                                }        
                            })
                        }
                    }
                }       
            }
        }
    }) 
    
    email = setTimeout( function() 
    {
        sendEmail();
    } , 10000);
}

sendEmail();

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