"use strict"
const express = require('express');
const path = require('path');
const Router = express.Router();
const mongoose = require('mongoose');

const studentTable = require('./schmeData/studentRecord');
const formStudent = require('./schmeData/formSurvey');
// const { red } = require('color-name');
// const { doesNotMatch } = require('assert');
// const { findByIdAndUpdate } = require('./schmeData/studentRecord');

mongoose.connection.on('connected' , function(err)
{
    if(err)
    {
        console.log("Fail to connect mongodb");
    }
})

// main UC site 
Router
    .route("")
    .get( function (req , res)
    {
        res.sendFile(path.join(__dirname , "../htmlPage/html/UCSite.html"  ));
    })
    .post(function (req , res){});


var dataToDisplay = "";
var stringUnitCode ="";
var stringTeamID ="";
var stringTeachPeriod ="";

// handle upload file in UC site 
Router
    .route("/upload")
    .get( function (req , res)
    {
        res.sendFile(path.join(__dirname , "../htmlPage/html/uploadFile.html"  ));
    })
    .post( function( req , res)
    {
       if(req.files)
       {
           // table database 
           const Schema = mongoose.model('students', studentTable.Schema);

           //get whole data 
           var dataFromFile = req.files.file.data.toString();
           
           // split data to smaller part
           var eachStudentData = dataFromFile.split('\r\n');

           // run the loop
            for(var i = 1 ; i < eachStudentData.length-1 ; i++)
            {
                dataToDisplay = dataToDisplay +  eachStudentData[i] +  ";";
                //split data from each student 
                var tempRecord = eachStudentData[i].split(',');

                //pass data for create form 
                stringUnitCode =  stringUnitCode + tempRecord[5]  +",";
                stringTeamID = stringTeamID +  tempRecord[6]+ ",";
                stringTeachPeriod =  stringTeachPeriod + tempRecord[4] + ",";

                //create object for student
                var studentRecord = 
                {
                    PersonId : tempRecord[0],
                    Surname : tempRecord[1],
                    Title : tempRecord[2],
                    Givenames : tempRecord[3],
                    teachPeriod : tempRecord[4],
                    UnitCode : tempRecord[5],
                    teamdID : tempRecord[6],
                    email : tempRecord[7],
                    status : "No",
                }

               // insert data to mongoose 
                const insertData = new Schema(studentRecord);
                insertData.save(function(err)
                {
                    if(err)
                    {
                        console.log("There is something went worng");
                    }
                });
            }         
       } 
       res.redirect('/UC/StudentDetail');
    });

  
//handle detail event 
Router
    .route('/StudentDetail')
    .get( function(req , res )
    {
        res.render(path.join(__dirname , "../htmlPage/html/studentDetail.html") , { data : dataToDisplay } );
        dataToDisplay="";
    })
    .post( function( req , res ){
        res.redirect('/UC/CreateForm');
    });


//hande event create form 
Router
    .route('/CreateForm')
    .get(function (req , res){
        res.render(path.join(__dirname , "../htmlPage/html/CreateForm.html"),
        {
            UnitCode : stringUnitCode,
            teamdID : stringTeamID,
            teachPeriod : stringTeachPeriod
        } );
        stringUnitCode = "";
        stringTeamID = "";
        stringTeachPeriod  = "";
    })
    .post(function(req ,res){
       
        var dataPack = req.body;
        console.log(req.body);
        const Schema = mongoose.model('formstudent',  formStudent.Schema);
        var containQuestion = [];
        //console.log(typeof (dataPack.question));
        if( typeof (dataPack.question) == "string")
        {
            var object = {
                question : dataPack.question,
                options : dataPack[dataPack.temporary]
            }

            containQuestion.push(object);
        }else if( typeof (dataPack.question) == "object")
        {
            for(var i = 0 ;  i < dataPack.question.length ; i++)
            {
                var object = 
                {
                     question : dataPack.question[i],
                     option : dataPack[dataPack.temporary[i]] 
                }
                 containQuestion.push(object);
            }
        }
        //object data 
        var formRecord  = 
        {
            title : req.body.title,
            unitCode : req.body.unitCode,
            teamdID : req.body.teamID,
            teachPer : req.body.teachPer,
            deadline : req.body.deadline,
            question : containQuestion
        }

        const insertData = new Schema(formRecord);
        insertData.save( function(err)
        {
            if(err)
            {
                console.log("Cannot insert new data");
            }
        });

        res.redirect("/UC/formCreated");
    })


//Router handle display form 
var idFromForm = "";
Router
    .route("/formCreated")
    .get(function (req ,res)
    {
        var id = [];
        var title=[];
        var unitCode = [];
        var teamdID = [];
        var teachPer =[];
        var deadline = [];
        var dataFormMongoDb = mongoose.model('formstudent',  formStudent.Schema);
        dataFormMongoDb.find(function(error, data) 
        {
            if(!error)
            {
                for(var i = 0 ; i < data.length ; i ++)
                {
                    id.push(data[i]._id);
                    title.push(data[i].title);
                    unitCode.push(data[i].unitCode);
                    teamdID.push(data[i].teamdID);
                    teachPer.push(data[i].teachPer);
                    deadline.push(data[i].deadline);
                }
            
                res.render(path.join(__dirname , "../htmlPage/html/formCreated.html") , 
                { 
                    id : id,
                    title : title,
                    unitCode : unitCode,
                    teamID : teamdID,
                    teachPer : teachPer,
                    deadline : deadline,                 
                });
            }else 
            {
                console.log("There is something went worng!!!!!!");
            }
        });
    })
    .post(function (req , res) {
        
        var eventDoing = req.body.event;

        idFromForm = req.body.id;

        if(eventDoing == "detele" )
        {
            var dataFormMongoDb = mongoose.model('formstudent',  formStudent.Schema);
            dataFormMongoDb.findByIdAndRemove({_id : req.body.id} ,  function(error, data) 
            {
                if(error)
                {
                    console.log("there is something went worng!!!!")
                }
                   
            })
            
        res.redirect('/UC/formCreated');

        }else if(eventDoing =="edit")
        {
            res.redirect("/UC/EditForm");
        }
    });


//handle edit form 
Router 
    .route("/EditForm")
    .get(function(req , res)
    { 
        if(idFromForm !="")
        {
            var dataFormMongoDb = mongoose.model('formstudent',  formStudent.Schema);
            dataFormMongoDb.find({_id : idFromForm} ,  function(error, data) 
            {
                var id = data[0].id;
                var title = data[0].title;
                var unitCode = data[0].unitCode;
                var teamID = data[0].teamdID;
                var teachPer = data[0].teachPer;
                var deadline = data[0].deadline;
                var tempoQuestion = data[0].question;

                var wholeQuestion = "";
                //console.log(tempoQuestion.length);
                for(var i = 0 ; i < tempoQuestion.length ; i++)
                {
                    wholeQuestion = wholeQuestion + tempoQuestion[i].question+','+ tempoQuestion[i].option  +";";
                }
            
                res.render(path.join(__dirname , "../htmlPage/html/editForm.html"),
                {
                    id : id , 
                    title : title,
                    unitCode : unitCode ,
                    teachPer : teachPer,
                    teamID : teamID,
                    deadline : deadline,
                    question : wholeQuestion
                });
             })  

             idFromForm ="";
        }
        else 
        {
            res.end("404 PAGE NOT FOUND");
        }
    })

    .post(function(req ,res)
    {
        var dataPack = req.body;
        var containQuestion = [];
        if( typeof (dataPack.question) == "string")
        {
            var object = {
                question : dataPack.question,
                options : dataPack[dataPack.temporary]
            }

            containQuestion.push(object);
        }else if( typeof (dataPack.question) == "object")
        {
            for(var i = 0 ;  i < dataPack.question.length ; i++)
            {
                //console.log(dataPack[dataPack.temporary[i]] + "\r\n");
                 var object = {
                     question : dataPack.question[i],
                     option : dataPack[dataPack.temporary[i]]
                 }
                 containQuestion.push(object);
            }
        }

        var dataFormMongoDb = mongoose.model('formstudent',  formStudent.Schema);

        var update = { 
            title : req.body.title,
            unitCode : req.body.unitCode,   
            teamdID : req.body.teamID,
            deadline : req.body.deadline,
            question : containQuestion
        };

        dataFormMongoDb.findByIdAndUpdate({_id : req.body.id}, update ,  function(error, data) 
        {
            if(!error)
            {
                data.save( function (err)
                {
                    if(!err)
                    {
                        console.log("OK");
                    }
                })
            }
            else 
            {
                console.log("cannot ");
            }
        })
                 
        res.redirect("/UC/formCreated");
    })

module.exports = Router;


