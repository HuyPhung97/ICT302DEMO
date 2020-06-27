"use strict"
const express = require('express');
const path = require('path');
const Router = express.Router();
const mongoose = require('mongoose');

const studentTable = require('./schmeData/studentRecord');
const formStudent = require('./schmeData/formSurvey');
const recordAnswer  = require('./schmeData/recordAnswer');

mongoose.connection.on('connected' , function(err)
{
    if(err)
    {
        console.log("Fail to connect mongodb");
    }
    else 
    {
        console.log("Student site have connect successful");
    }
})

// email ID : demoICT302 , pwd: passExam
// Route student
// Router 
//     .route("/")
//     .get(function(req , res)
//     {
//         res.sendFile(path.join(__dirname , "../htmlPage/student/studentSite.html"  ));
//     });
   
//create URL for student 
function createURLStudent()
{
    var dataFormMongoDb = mongoose.model('students',  studentTable.Schema);

    var fromFromMongoDb = mongoose.model('formstudent', formStudent.Schema);

    var checkAnswer = mongoose.model('recordAnswer', recordAnswer.Schema)

    dataFormMongoDb.find(function(error, data) 
    {
        if(!error)
        {
            for(let i = 0 ; i < data.length ; i++)
            {
                Router 
                    .route("/id="+data[i].PersonId)
                    .get(function(req ,res)
                    {
                        var otherName =[];
                        var question = [];

                        for(let j = 0 ; j < data.length ; j++)
                        {
                            if(data[i].PersonId != data[j].PersonId && data[i].UnitCode == data[j].UnitCode && 
                            data[i].teachPeriod == data[j].teachPeriod && data[i].teamdID == data[j].teamdID)
                            {
                                otherName.push(data[j].Surname);
                            } 
                        }

                        var findData = {
                            unitCode : data[i].UnitCode,
                            teachPer : data[i].teachPeriod
                        }
                    
                        var checkData = 
                        {
                            PersonId : data[i].PersonId,
                            Surname : data[i].Surname,
                            UnitCode : data[i].UnitCode,
                            teamdID : data[i].teamdID
                        }

                        checkAnswer.find( checkData, function (err,  checkData)
                        {
                            if(checkData.length != 0 )
                            {
                                res.sendFile(path.join(__dirname , "../htmlPage/student/displaySubmit.html"))
                            }
                            else 
                            {
                                fromFromMongoDb.find( findData , function(err, event)
                                {
                                    if(!err)
                                    {
                                        console.log(event.length);
                                        if(event.length == 0)
                                        {
                                            // no question case 
                                            res.sendFile(path.join(__dirname , "../htmlPage/student/caseNotQuestion.html"))
                                        }
                                        else if(event.length != 0)
                                        {
                                            console.log(typeof event[0].question);
                                            if(typeof event[0].question == "string")
                                            {
                                                question.push(event[0].question);
                                            }
                                            else if(typeof event[0].question == "object")
                                            {
                                                for(let j = 0 ; j < event[0].question.length ; j++)
                                                {
                                                    //console.log(event[0].question[j]);
                                                    question.push(event[0].question[j]);
                                                }   
                                            }
                                            //console.log( data[i]);
                                            res.render(path.join(__dirname , "../htmlPage/student/studentSite.html"),
                                            {
                                                id  : data[i].id,
                                                PersonId  : data[i].PersonId,
                                                SurName : data[i].Surname,
                                                Givename : data[i].Givenames,
                                                teamID : data[i].teamdID,
                                                UnitCode : data[i].UnitCode,
                                                otherName : otherName,
                                                question : question
                                            });
                                        }    
                                        question=[];
                                    }             
                                });
                            }   
                        })
                    })

                    .post(function(req , res) {

                        var insertData = mongoose.model('recordAnswer', recordAnswer.Schema);
                        var eachPerson = req.body.SurName;
                        var eachQuestion = req.body.question.split(',');

                        var personAnswer;
                        var contaiWhole = [];
                        if(typeof eachPerson =="string")
                        {
                            var tempAns = [];
                            var tempQues =[];
                            for(var j = 0 ;  j < eachQuestion.length ; j++)
                            {
                                    var eachAnswer = req.body[eachPerson+j];
                                    tempAns.push(eachAnswer);
                                    tempQues.push(eachQuestion[j]);
                            }
                            var obj = 
                                {
                                    name : eachPerson,
                                    question : tempQues,
                                    answer : tempAns,
                                }
                            contaiWhole.push(obj);
                            personAnswer = 
                            {
                                PersonId : req.body.PersonId,
                                Surname : req.body.SurName,
                                UnitCode : req.body.UnitCode,
                                teachPer : req.body.teachPeriod,
                                teamdID : req.body.teamID,
                                Answer : contaiWhole,
                            }
                        }
                        else 
                        {
                            for(var i = 0 ; i  < eachPerson.length ; i++)
                            {
                                var tempAns = [];
                                var tempQues =[];
                                for(var j = 0 ;  j < eachQuestion.length ; j++)
                                {
                                    var eachAnswer = req.body[eachPerson[i]+j];
                                    tempAns.push(eachAnswer);
                                    tempQues.push(eachQuestion[j]);
                                }
                                var obj = 
                                {
                                    name : eachPerson[i],
                                    question : tempQues,
                                    answer : tempAns,
                                }
                                contaiWhole.push(obj);
                            }

                            personAnswer = 
                            {
                            PersonId : req.body.PersonId,
                            Surname : req.body.SurName[0],
                            UnitCode : req.body.UnitCode,
                            teamdID : req.body.teamID,
                            Answer : contaiWhole,
                            }
                        }
  
                        const tempo = new insertData(personAnswer);
                        tempo.save(function(err)
                        {
                            if(err)
                            {
                                console.log("There is something went wrong!!!!!!");
                            }
                            else
                            {
                                console.log("Insert successful");
                            }
                        });
                        
                        var dataFormMongoDb = mongoose.model('students',  studentTable.Schema);
                        var update = { status : "Yes"};
                        dataFormMongoDb.findOneAndUpdate({PersonId : req.body.PersonId}, update ,  function(err , data)
                        {
                            if(!err)
                            {
                                data.save(function(err)
                                {
                                    if(err)
                                    {
                                        console.log("Something wrong at update status!!!!!");
                                    }else 
                                    {
                                        console.log("Updated status successful!!");
                                    }
                                });
                               
                            }
                        })
                        res.redirect("/");
                    });
            }
        }
    })
}
createURLStudent();


module.exports = Router;