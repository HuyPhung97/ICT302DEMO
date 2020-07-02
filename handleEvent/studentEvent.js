"use strict"
const express = require('express');
const app = express();
const path = require('path');
const Router = express.Router();
const mongoose = require('mongoose');

const studentTable = require('./schmeData/studentRecord');
const formStudent = require('./schmeData/formSurvey');
const recordAnswer  = require('./schmeData/recordAnswer');


//app.use(express.static(__dirname , 'htmlPage'));
// app.use(express.static('/htmlPage'));

// email ID : demoICT302 , pwd: passExam
// Route student
Router 
    .route("/")
    .get(function(req , res)
    {
        res.render(path.join(__dirname + "../htmlPage/student/studentSite.html"  ));
    });
   
//create URL for student 

mongoose.connection.on('connected' , function(err)
{
    if(err)
    {
        console.log("Fail to connect mongodb");
    }
});

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
            var status = data[i].status;
            
            for(var j = 0 ; j < titleForm.length ; j++)
            {
                let number = titleForm.length;
                let newTitle = titleForm[j];
                let newStatus = status[j];
                let eachStudent = data[i];
                
                Router
                .route('/id='+data[i].PersonId+'/form='+titleForm[j])
                .get(function(req ,res)
                {
                    // console.log(newTitle);
                    // console.log(newStatus);
                    if(newStatus == "Yes")
                    {
                        res.render(path.join(__dirname , "/displaySubmit.html"));
                    }
                    else 
                    {
                        //find teammate 
                        var nameTeammate = [];
                        for(var e = 0 ; e < data.length ; e++)
                        {
                            if(eachStudent.teamdID != data[e].teamdID && eachStudent.unitCode == data[e].unitCode 
                            && eachStudent.teachPeriod == data[e].teachPeriod && eachStudent.PersonId && data[e].PersonId)
                            {
                                nameTeammate.push(data[e].Surname);
                            }
                        } 

                        //find question
                        var findData = 
                        {
                            title : newTitle,
                            unitCode : data[i].UnitCode,
                            teachPer : data[i].teachPeriod
                        }
                            
                        formFromMongoDb.find(findData , function(err , form)
                        {
                            var current = getDate();
                            var deadline = Date.parse(form[0].deadline);
                            var currentDate = Date.parse(current);   
                            var diffDays = parseInt((deadline - currentDate) / (1000 * 60 * 60 * 24), 10); 

                            if(diffDays == 0)
                            {
                                res.end("<p> Form had expired !!!! </p> ");
                            }
                            else 
                            {
                                res.render(path.join(__dirname , "../htmlPage/student/StudentSite.html"),
                                {
                                    // PersonId : "Hello wolrd",
                                    // SurName : "Hello wolrd",
                                    // UnitCode : "Hello wolrd",
                                    // teachPer : "Hello wolrd",
                                    // teamdID : "Hello wolrd",
                                    // otherName : "Hello wolrd",
                                    // question : "Hello wolrd",
                                    // title : "Hello wolrd"
                                    PersonId : data[i].PersonId,
                                    SurName : data[i].Surname,
                                    UnitCode : data[i].UnitCode,
                                    teachPer : data[i].teachPeriod,
                                    teamdID : data[i].teamdID,
                                    otherName : nameTeammate,
                                    question : form[0].question,
                                    title : form[0].title
                                });
                            }                     
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

                    //insert answer from student
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
    })

    myVar = setTimeout(function()
    {
        createURLStudent();
    }, 3000);
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


createURLStudent();
module.exports = Router;

