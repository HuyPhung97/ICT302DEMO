"use strict"
const express = require('express');
const app = express();
const path = require('path');
const Router = express.Router();
const mongoose = require('mongoose');

const studentTable = require('./schmeData/studentRecord');
const formStudent = require('./schmeData/formSurvey');
const recordAnswer  = require('./schmeData/recordAnswer');

//app.use(express.static(path.join(__dirname , 'htmlPage')));
app.use(express.static(__dirname + '/htmlPage'));
// app.use(express.static('/htmlPage'));

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
var myVar;
function createURLStudent()
{
    var studentFromDatabase = mongoose.model('students',  studentTable.Schema);

    var formFromMongoDb = mongoose.model('formstudent', formStudent.Schema);

    var checkAnswer = mongoose.model('recordAnswer', recordAnswer.Schema)

    studentFromDatabase.find(function(err , data )
    {
        for(let i = 0 ; i < data.length ; i++)
        {
            var titleForm = data[i].formName;
            let status = data[i].status;

            if(titleForm.length != 0)
            {
                for(let j = 0 ; j < titleForm.length ; j++)
                {
                  // console.log(status.formName[j]);
                  // console.log(status[j]);
                    Router
                    .route('/id='+data[i].PersonId+'/form='+titleForm[j])
                    .get(function(req ,res)
                    {
                        console.log(status[j]);
                        if(status[j] == "Yes")
                        {
                            //res.end("Hello world");
                            res.render(path.join(__dirname , "../htmlPage/student/displaySubmit.html"));
                        }
                        else 
                        {
                            //find teammate 
                            var nameTeammate = [];
                            for(var e = 0 ; e < data.length ; e++)
                            {
                                if(data[i].teamdID == data[e].teamdID && data[i].unitCode == data[e].unitCode 
                                && data[i].teachPeriod == data[e].teachPeriod && data[i].PersonId && data[e].PersonId)
                                {
                                    nameTeammate.push(data[e].Surname);
                                }
                            } 
                            
                            //find question
                            var findData = 
                            {
                                title : titleForm[j],
                                unitCode : data[i].UnitCode,
                                teachPer : data[i].teachPeriod
                            }
                          

                            formFromMongoDb.find(findData , function(err , form)
                            {
                                res.render(path.join(__dirname , "../htmlPage/student/StudentSite.html"),
                                {
                                    PersonId : data[i].PersonId,
                                    SurName : data[i].Surname,
                                    UnitCode : data[i].UnitCode,
                                    teachPer : data[i].teachPeriod,
                                    teamdID : data[i].teamdID,
                                    otherName : nameTeammate,
                                    question : form[0].question,
                                    title : form[0].title
                                });
                           })
                        }
                    })

                    .post(function(req ,res)
                    {
                        console.log(req.body);
                        var insertData = mongoose.model('recordAnswer', recordAnswer.Schema);
                        var dataAnswer = req.body;
                        var eachPerson = dataAnswer.SurName;
                        var eachQuestion = dataAnswer.question.split(',');
                        var personAnswer;
                        var contaiWhole = [];
                        if(typeof eachPerson =="string" )
                        {
                            var tempAns = [];
                            var tempQues =[];
                            for(var i = 0 ;  i < eachQuestion.length ; i++)
                            {
                                var eachAnswer = req.body[eachPerson+i];
                                tempAns.push(eachAnswer);
                                tempQues.push(eachQuestion[i]);
                            }
                            var obj = 
                            {
                                name : eachPerson,
                                question : tempQues,
                                answer : tempAns,
                            }
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
                                teachPeriod : req.body.teachPer,
                                teamdID : req.body.teamID,
                                Answer : contaiWhole,
                            }
                        }

                        // insert answer from student
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
                        var findData = 
                        {
                            PersonId : req.body.PersonId,
                            UnitCode :req.body.UnitCode,
                            teachPeriod : req.body.teachPer,
                            teamdID : req.body.teamID
                        }
                        dataFormMongoDb.find( findData  , function(err , data)
                        {
                            for(var j = 0 ; j < data[0].formName.length ; j++)
                            {
                                if(data[0].formName[j] == req.body.title)
                                {
                                    data[0].status[j] = "Yes";
                                    dataFormMongoDb.findOneAndUpdate({_id : data[0]._id} , {status : data[0].status}, function(err , event )
                                    {
                                        if(!err)
                                        {
                                            event.save(function(err)
                                            {
                                                if(!err)
                                                {
                                                    console.log("OK");
                                                }
                                            })
                                        }
                                    });
                                }
                            }                
                        });
                        res.end();
                    })
                }
            }
        }
    })
}   

createURLStudent();
module.exports = Router;

