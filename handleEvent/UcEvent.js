"use strict"
const express = require('express');
const path = require('path');
const app = express();
const  fs = require('fs');
const Router = express.Router();
const mongoose = require('mongoose');

const studentTable = require('./schmeData/studentRecord');
const formStudent = require('./schmeData/formSurvey');
const groupStudent = require('./schmeData/studentGroup');
const recordAnswer  = require('./schmeData/recordAnswer');
const { dirname } = require('path');
const { RSA_NO_PADDING } = require('constants');
const { count } = require('console');
const { find } = require('./schmeData/studentRecord');


// const { red } = require('color-name');
// const { doesNotMatch } = require('assert');
// const { findByIdAndUpdate } = require('./schmeData/studentRecord');


mongoose.connection.on('connected' , function(err)
{
    if(err)
    {
        console.log("Fail to connect mongodb");
    }
    else 
    {
        console.log("UC site connected !!!");
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
// var stringTeamID ="";
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

           // group student 
           const eachGroup = mongoose.model('studentGroups', groupStudent.Schema);

           //get whole data 
           var dataFromFile = req.files.file.data.toString();
           
           // split data to smaller part
           var eachStudentData = dataFromFile.split('\r\n');

          
           var tempoEachID = [];
           // run the loop
            for(let i = 1 ; i < eachStudentData.length-1 ; i++)
            {
                dataToDisplay = dataToDisplay +  eachStudentData[i] +  ";";
                //split data from each student 
                var tempRecord = eachStudentData[i].split(',');

                //pass data for create form 
                stringUnitCode =  stringUnitCode + tempRecord[5]  +",";
                //stringTeamID = stringTeamID +  tempRecord[6]+ ",";
                stringTeachPeriod =  stringTeachPeriod + tempRecord[4] + ",";

                //create object for student
                let update = 
                {
                    PersonId : tempRecord[0],
                    Surname : tempRecord[1],
                    Title : tempRecord[2],
                    Givenames : tempRecord[3],
                    teachPeriod : tempRecord[4],
                    UnitCode : tempRecord[5],
                    teamdID : tempRecord[6],
                    email : tempRecord[7],
                }
                tempoEachID.push(tempRecord[0]);
                Schema.find( update , function(err ,data)
                {
                    if(data.length != 0)
                    {
                        Schema.findOneAndUpdate(update , update , function(err ,data)
                        {
                            if(!err)
                            {
                                data.save(function(err)
                                {
                                    if(err)
                                    {
                                        console.log("There is something wrong at upload!!!");
                                    }
                                })
                            }
                        })         
                    }
                    else if(data.length == 0)
                    {
                        //insert data to mongoose 
                        const insertData = new Schema(update);
                        insertData.save(function(err)
                        {
                            if(err)
                            {
                                console.log("There is something wrong at upload!!!");
                            }
                        });
                    }
                })            
            }    
    
            eachGroup.find(function(err , packData)
            {
                if(packData.length == 0)
                {
                    var object = 
                    {
                        name : req.files.file.name.replace('.csv', ''),
                        date : getDate(),
                        groupStudentID : tempoEachID
                    }

                    const insertData = new eachGroup(object);
                    insertData.save(function(err ,data)
                    {
                        if(err)
                        {
                            console.log("Error at each group!!!");
                        }
                    })
                }
                else 
                {
                    var check = packData.length;
                    for( var i = 0 ; i < packData.length ; i++)
                    {
                        if(JSON.stringify(packData[i].groupStudentID) == JSON.stringify(tempoEachID))
                        {
                            eachGroup.findOneAndUpdate({_id : packData[i].id } , {groupStudentID : tempoEachID , date : getDate()} , function(err ,data)
                           {
                               if(!err)
                               {
                                    data.save(function(err)
                                    {
                                        if(err)
                                        {
                                            console.log("error at group student duplicate!!!!!");
                                        }
                                    })
                               }
                           })
                           check--;
                        }          
                    }
                    if(check == packData.length)
                    {
                        var object = 
                        {
                            name : req.files.file.name.replace('.csv', ''),
                            date : getDate(),
                            groupStudentID : tempoEachID
                        }
                      
                        const insertData = new eachGroup(object);
                        insertData.save(function(err ,data)
                        {
                            if(err)
                            {
                                console.log("Error at each group!!!");
                            }
                        })
                    }
                }
            })
        } 
         res.redirect('/UC/StudentDetail');
    });

//handle file have upload 

var tempoID ="";
Router
    .route("/fileUploaded")
    .get( function (req ,res)
    {   
        const eachGroup = mongoose.model('studentGroups', groupStudent.Schema);

        eachGroup.find( function(err , data)
        {
            if(data.length == 0 )
            {
                res.render(path.join(__dirname , "../htmlPage/html/fileUpload.html"),
                {
                    id : "nothing",
                    date : "nothing",
                    title  : "nothing",              
                });
            }
            else 
            {
                var id = [];
                var title = [];
                var date =[];
                for(var i = 0 ; i < data.length ; i++)
                {
                    id.push(data[i].id);
                    date.push(data[i].date);
                    title.push(data[i].name);
                }
                res.render(path.join(__dirname , "../htmlPage/html/fileUpload.html"),
                {
                    id : id,
                    date : date,
                    title  : title,              
                });
            }
        })
    })
    .post(function (req ,res)
    {
        tempoID = req.body.id;
        res.redirect('/UC/DetailFile');
    })


var tempUnit = [];
var tempoTeach = [];
Router
    .route("/DetailFile")
    .get(function(req , res)
    {
        const eachGroup = mongoose.model('studentGroups', groupStudent.Schema);

        // table database 
        const Schema = mongoose.model('students', studentTable.Schema);
        if(tempoID == "")
        {
            res.end("404 PAGE NOT FOUND");
        }
        else 
        {
            eachGroup.find({ _id : tempoID} , function(err ,data)
            {
                var PersonID = [];
                var Surname = [];
                var Title = [];
                var Givenames = [];
                var teachPeriod = [];
                var UnitCode = [];
                var teamdID = [];
                var email = [];
            
                Schema.find(function(err , pack)
                {
                    if(pack.length == 0)
                    {
                        res.render(path.join(__dirname , "../htmlPage/html/DetailFile.html"),
                        {
                            PersonID : "nothing",
                            Surname : "nothing",
                            Title  : "nothing",   
                            Givenames : "nothing",
                            teachPeriod : "nothing",
                            UnitCode  : "nothing",  
                            teamdID : "nothing",
                            email  : "nothing"      
                        });
                    }
                    else 
                    {
                        for(var i = 0 ; i < data[0].groupStudentID.length ; i++)
                        {
                            for(var j = 0 ; j < pack.length ; j++)
                            {
                                if(data[0].groupStudentID[i] == pack[j].PersonId)
                                {
                                    PersonID.push(pack[j].toObject().PersonId);
                                    Surname.push(pack[j].toObject().Surname);
                                    Title.push(pack[j].toObject().Title);
                                    Givenames.push(pack[j].toObject().Givenames);
                                    teachPeriod.push(pack[j].toObject().teachPeriod);
                                    UnitCode.push(pack[j].toObject().UnitCode);
                                    teamdID.push(pack[j].toObject().teamdID);
                                    email.push(pack[j].toObject().email);
                                }
                            }
                        }
                        
                        res.render(path.join(__dirname , "../htmlPage/html/DetailFile.html"),
                        {
                            PersonID : PersonID,
                            Surname : Surname,
                            Title  : Title,   
                            Givenames : Givenames,
                            teachPeriod : teachPeriod,
                            UnitCode  : UnitCode,  
                            teamdID : teamdID,
                            email  : email      
                        });
                    }
                })
            })
        }
       
       tempoID="";
    })
    .post(function(req , res)
    {
        
        tempUnit =  req.body.UnitCode.split(',');
        tempoTeach = req.body.teachPeriod.split(',');  

        res.redirect("/UC/CreateForm");
    })

  
//handle detail event 
var studentUnit = [];
var studentTeach =[];
Router
    .route('/StudentDetail')
    .get( function(req , res )
    {
        res.render(path.join(__dirname , "../htmlPage/html/studentDetail.html") , { data : dataToDisplay } );
        dataToDisplay="";
    })
    .post( function( req , res ){
        studentUnit = req.body.UnitCode.split(',');
        studentTeach = req.body.teach.split(',');
        res.redirect('/UC/CreateForm');
    });

//handle create form
var titleForm, unitCode, teachPer;
Router
    .route('/CreateForm')
    .get(function (req , res){

        if(tempUnit != "" &&  tempoTeach != "" )
        {
            var newUnit =  filterData(tempUnit);
            var newTeach =  filterData(tempoTeach);

            res.render(path.join(__dirname , "../htmlPage/html/CreateForm.html"),
            {
                UnitCode : newUnit,
                teachPeriod : newTeach
            });

            tempUnit ="";
            tempoTeach="";
        }
        else if(studentUnit != "" && studentTeach != "")
        {
            var newUnit =  filterData(studentUnit);
            var newTeach =  filterData(studentTeach);

            res.render(path.join(__dirname , "../htmlPage/html/CreateForm.html"),
            {
                UnitCode : newUnit,
                teachPeriod : newTeach
            });

            studentUnit ="";
            studentTeach="";
        }
        else 
        {
            const dataFormMongoDb = mongoose.model('students',  studentTable.Schema);
            dataFormMongoDb.find( function(err ,data)
            {
                if(err)
                {
                    console.log("there is something wrong!!!");
                }
                else
                {
                    if(data.length != 0)
                    {
                        var unitCode = [];
                        var teachPer = [];

                        for(var i = 0 ; i < data.length ; i++)
                        {         
                            unitCode.push(data[i].UnitCode);
                            teachPer.push(data[i].teachPeriod);
                        }

                        var newUnit =  filterData(unitCode);
                        var newTeach =  filterData(teachPer);

                        res.render(path.join(__dirname , "../htmlPage/html/CreateForm.html"),
                        {
                            UnitCode : newUnit,
                            teachPeriod : newTeach
                        });
                    }
                    else 
                    {
                        res.render(path.join(__dirname , "../htmlPage/html/CreateForm.html"),
                        {
                            UnitCode : "nothing",
                            teachPeriod : "nothing"
                        });
                    }
                }
            })
        }

        // res.render(path.join(__dirname , "../htmlPage/html/CreateForm.html"),
        // {
                //     UnitCode : stringUnitCode,
        //     teachPeriod : stringTeachPeriod
        // });
        // stringUnitCode = "";
        // //stringTeamID = "";
        // stringTeachPeriod  = ""; 
    })
    .post(function(req ,res)
    {   
        console.log(req.body);
        var dataPack = req.body;
        const Schema = mongoose.model('formstudent',  formStudent.Schema);
        var containQuestion = [];
        //object data
        var formRecord ;
        titleForm = req.body.title;
        unitCode =  req.body.unitCode;
        teachPer =req.body.teachPer;
        //console.log(typeof (dataPack.question));
        if( typeof (dataPack.question) == "string")
        {
            formRecord  = 
            {
                title : req.body.title,
                unitCode : req.body.unitCode,
                teachPer : req.body.teachPer,
                deadline : req.body.deadline,
                question : dataPack.question
            }
        }
        else if( typeof (dataPack.question) == "object")
        {
            for(var i = 0 ;  i < dataPack.question.length ; i++)
            {
                containQuestion.push(dataPack.question[i]);
            }

            formRecord  = 
            {
                title : req.body.title,
                unitCode : req.body.unitCode,
                teachPer : req.body.teachPer,
                deadline : req.body.deadline,
                question : containQuestion
            }
        }

        const dataFormMongoDb = mongoose.model('students',  studentTable.Schema);
        dataFormMongoDb.find({UnitCode : req.body.unitCode , teachPeriod : req.body.teachPer}, function(err ,data)
        {
            for(var i = 0 ; i < data.length ; i++)
            {
                // var status = { title : data[i].status.title.push("eh") , status : ["No"]};
                data[i].formName.push(req.body.title)
                data[i].status.push("No");
                data[i].sendMail.push("No");
             
                var update = 
                {
                    formName :  data[i].formName,
                    status : data[i].status,
                    sendMail : data[i].sendMail
                }

                dataFormMongoDb.findOneAndUpdate({_id : data[i].id} , update , function(err ,event)
                {
                    if(!err)
                    {
                        event.save(function(err)
                        {
                            if(err)
                            {
                                console.log("Error at status!!!");
                            }
                        })
                    }
                })
               
            }
        })
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
                    teachPer.push(data[i].teachPer);
                    deadline.push(data[i].deadline);
                }
            
                res.render(path.join(__dirname , "../htmlPage/html/formCreated.html") , 
                { 
                    id : id,
                    title : title,
                    unitCode : unitCode,
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
            //remove form from student.
            const studentRecord = mongoose.model('students',  studentTable.Schema);
            studentRecord.find(function(err , eachStudent)
            {
                //console.log(eachStudent.length);
                for(var i = 0 ;  i < eachStudent.length ; i++)
                {
                    var check = eachStudent[i].formName.indexOf(req.body.title);
                    if( check > -1)
                    {
                        eachStudent[i].formName.splice(check, 1);
                        eachStudent[i].status.splice(check, 1);
                        eachStudent[i].sendMail.splice(check, 1);
                    }

                    var update = 
                    {
                        formName :  eachStudent[i].formName,
                        status : eachStudent[i].status,
                        sendMail : eachStudent[i].sendMail
                    }

                    studentRecord.findOneAndUpdate({PersonId : eachStudent[i].PersonId} , update , function(err ,data)
                    {
                        if(!err)
                        {
                            data.save(function(err)
                            {
                                if(err)
                                {
                                    console.log("Fail to update");
                                }
                            })
                        }
                    })   
                }    
            })

            //remove the form from database
            var dataFormMongoDb = mongoose.model('formstudent',  formStudent.Schema);
            dataFormMongoDb.findByIdAndRemove({_id : req.body.id} ,  function(error, data) 
            {
               if(error)
               {
                   console.log("error at delete data");
               }
            })
            
          
        res.redirect('/UC/formCreated');

        }
        else if(eventDoing =="download")
        {
            var dataFormMongoDb = mongoose.model('formstudent',  formStudent.Schema);
            const studentRecord = mongoose.model('students',  studentTable.Schema);
            var recordResult = mongoose.model('recordAnswer',  recordAnswer.Schema);

            //find data from formStudent
            var findData = 
            {
                title  : req.body.title,
                unitCode : req.body.unitCode,
                teachPer : req.body.teachPer
            }

            // find data from record Result
            var findStudent =
            {
                UnitCode :  req.body.unitCode,
                teachPeriod :req.body.teachPer,
            }


            dataFormMongoDb.findOne(findData , function(err , formStudent)
            {
                let numberQuestion = formStudent.question.length;
                
                var total = "";
                var titleForm = ["Title Form\t " , req.body.title , "\r\n"];
                total = total + titleForm;
                   
                studentRecord.find(findStudent , function (err , eachStudent)
                {
                    recordResult.find( function(err , recordAnswer)
                    {   
                        var answer = [];
                        // for(var m = 0 ; m < recordAnswer.length ; m++)
                        // {
                            // if(recordAnswer[m].formName == req.body.title)
                            // {
                                // loop check teamID
                                var numberTeam = [];
                                var numberOfEachTeam = [];
                                for(var i = 0 ; i < eachStudent.length ; i++)
                                {
                                    numberTeam.push(eachStudent[i].teamdID);
                                }    
                                // remove duplicate teamID
                                var sortNumberTeam = filterData(numberTeam);  

                                //cacluate number of each team 
                                for(var i = 0 ; i < sortNumberTeam.length ; i++)
                                {
                                    var countEachTeam = 0;
                                    for(var j = 0 ; j < eachStudent.length ; j++)
                                    {
                                        if(sortNumberTeam[i] == eachStudent[j].teamdID)
                                        {
                                            countEachTeam++;
                                        }
                                    }
                                    numberOfEachTeam.push(countEachTeam);
                                }

                                //get the diff between 
                                var PersonIdHave = [];
                                for(var i = 0 ; i < recordAnswer.length ; i++)
                                {
                                    if(recordAnswer[i].formName == req.body.title)
                                    {
                                        PersonIdHave.push(recordAnswer[i].PersonId);
                                    }
                                }

                                var totalPerson = [];
                                for(var i = 0 ; i < eachStudent.length ; i++)
                                {
                                    totalPerson.push(eachStudent[i].PersonId);
                                }
                            
                                var diff = difference(totalPerson ,PersonIdHave );

                                // get data 
                                for(var i = 0 ; i < sortNumberTeam.length ; i++)
                                {
                                    var groupStudent = [ "TeamID " , sortNumberTeam[i]+"\r\n" , "Student being assssed" ," " , " " ," ", " ", " "];
                                    var assCriteria = [ " " ,   "Assessment Criteria " , " " , " " ," ", " " , " "];
                                    var title = ["TEAM #" , "StudentID" , "Surname", "Title" , "Give Name"];
                                    var arvage =  [ " " ,   "Average of  Criteria " , " " , " " ," ", " " , " "];
                                    var eachDetail = "" ;
                                    for(var j = 0 ; j < eachStudent.length ;j++)
                                    {       
                                        if(sortNumberTeam[i] == eachStudent[j].teamdID)
                                        {  
                                            var detailStudent = [eachStudent[j].teamdID , eachStudent[j].PersonId, eachStudent[j].Surname, eachStudent[j].Title , eachStudent[j].Givenames ];
                                            var eachMem = [];
                                            var eachQuestion = [];
                                            for(var e = 0 ; e < numberQuestion ; e++)
                                            {
                                                if(e/2 == 1|| e/2 == 0)
                                                {
                                                    eachMem.push(" ");
                                                    eachMem.push(eachStudent[j].PersonId);
                                                }else 
                                                {
                                                    eachMem.push(" ");
                                                    eachMem.push(" ");
                                                    eachMem.push(" ");
                                                }
                                            }
                                            groupStudent = groupStudent + eachMem;

                                            // get question 
                                            for( var e = 0 ; e < formStudent.question.length ; e++)
                                            {
                                                eachQuestion.push(formStudent.question[e]);
                                            }
                                            eachQuestion.push("Average from each");
                                            eachQuestion.push(" ");
                                            eachQuestion.push(" ");
                                            assCriteria = assCriteria + eachQuestion ;  

                                            //get answer 
                                            var numberAns = 0;
                                            var check = false;
                                            for(var z = 0 ; z < diff.length ; z++)
                                            {
                                                if(eachStudent[j].PersonId == diff[z])
                                                {
                                                    check = true; 
                                                }  
                                            }

                                            for(var e = 0  ; e <  recordAnswer.length ; e++)
                                            {
                                                var eachAnswer = [];
                                                eachAnswer.push(" ");
                                                if(eachStudent[j].PersonId == recordAnswer[e].PersonId && recordAnswer[e].formName == req.body.title)
                                                {
                                                    var answer = recordAnswer[e].Answer;
                                                    for(var h = 0 ; h < answer.length ; h++)
                                                    {
                                                        eachAnswer.push(" ");
                                                        var numberAnswer = answer[h].question;
                                                        var aveEach = 0 ;
                                                        numberAns = numberAnswer.length;
                                                        for(var t = 0 ; t < numberAnswer.length ; t++)
                                                        {
                                                            eachAnswer.push(answer[h].answer[t]);
                                                            aveEach = parseInt(answer[h].answer[t]) + aveEach;                                              
                                                        }
                                                        eachAnswer.push(aveEach/numberQuestion);   
                                                    }
                                                }
                                                else if( check )
                                                {
                                                    eachAnswer.push(" ");
                                                    for(var g = 0 ; g < numberOfEachTeam[i] ; g++ )
                                                    {
                                                        for(var h = 0 ; h < numberQuestion ; h++)
                                                        {
                                                            eachAnswer.push(" 0 ");
                                                        }
                                                        eachAnswer.push(" 0 ");     
                                                        eachAnswer.push(" ");              
                                                    }   
                                                    check = false;
                                                }
                                            
                                                detailStudent = detailStudent + eachAnswer;
                                            }

                                            eachDetail = eachDetail + detailStudent +"\r\n";
                                        }
                                    }

                                    //caculate ave from each row
                                    for(var g = 0 ; g < numberOfEachTeam[i] ; g++ )
                                    {
                                        var aveOfEach =[];
                                        var aveTotal = 0;
                                        for(var h = 0 ; h < numberQuestion ; h++)
                                        {
                                            var ave= 0;
                                            for(var e = 0 ; e < recordAnswer.length ; e++)
                                            {
                                                if(sortNumberTeam[i] == recordAnswer[e].teamdID && recordAnswer[e].formName == req.body.title)
                                                { 
                                                    ave = ave + parseInt(recordAnswer[e].Answer[g].answer[h]);  
                                                }           
                                            }
                                            var each = ave/numberOfEachTeam[i];
                                            aveOfEach.push((ave/numberOfEachTeam[i]).toFixed(3));
                                            aveTotal = aveTotal + each;
                                        }   
                                
                                        aveOfEach.push( (aveTotal/numberQuestion).toFixed(3));
                                        aveOfEach.push(" ");
                                        aveOfEach.push(" ");
                                        arvage = arvage + aveOfEach;   
                                    }         
                        
                                    total = total + groupStudent+"\r\n" + assCriteria + "\r\n"+title+ "\r\n"+ eachDetail + arvage + "\r\n\r\n" ;
                                }                     
                            // }
                        // }

                        fs.writeFile(path.join(__dirname , "../csvData/data.csv") ,total  , function(err)
                        {
                            if(err)
                            {
                                console.log("Error");
                            }
                            else 
                            {
                                res.download(path.join(__dirname , '../csvData/data.csv') , function(err)
                                {
                                    if(err)
                                    {
                                        console.log("Err");
                                    }
                                })
                            }
                        }) // fs write file


                    })//recordResult                 
                }) //studentRecord  
            }) // dataFormMongoDb
        }
        else if(eventDoing =="edit")
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
                res.render(path.join(__dirname , "../htmlPage/html/editForm.html"),
                {
                    id : data[0].id , 
                    title : data[0].title,
                    unitCode : data[0].unitCode ,
                    teachPer : data[0].teachPer,
                    deadline : data[0].deadline,
                    question : data[0].question
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
        var update;
        if( typeof (dataPack.question) == "string")
        {
            update = { 
                title : dataPack.title,
                unitCode : dataPack.unitCode,   
                teachPer : dataPack.teachPer,
                deadline : dataPack.deadline,
                question : dataPack.question
            };
        }
        else if( typeof (dataPack.question) == "object")
        {
            for(var i = 0 ;  i < dataPack.question.length ; i++)
            {
                 containQuestion.push(dataPack.question[i]);
            }
            update = { 
                title : req.body.title,
                unitCode : req.body.unitCode,   
                teachPer : req.body.teachPer,
                deadline : req.body.deadline,
                question : containQuestion
            };
        }
        
        console.log(update);
        var dataFormMongoDb = mongoose.model('formstudent',  formStudent.Schema);

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

//function remove duplicate data 
function filterData(dataDup)
{
    var data = dataDup.filter((value , index) => dataDup.indexOf(value) === index);
    return data;
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

function difference(a1, a2) 
{
    var result = [];
    for (var i = 0; i < a1.length; i++) {
      if (a2.indexOf(a1[i]) === -1) {
        result.push(a1[i]);
      }
    }
    return result;
}

// function transfer( a)
// {
//     var student = [];
//     for(var i= 0 ; i < a.length ; i++)
//     {
//         student.push(a[i].PersonId);
//     }
//     return student;
// }


module.exports = Router;


