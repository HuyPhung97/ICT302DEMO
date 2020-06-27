
//count question 
var countQuestion  = 0;
var checkCreate =0;
//handle create new question
function createNewQuestion()
{
    var questionBox = document.getElementById('containQuestion');

    var containQuestionID = "containerOfQuestion" + countQuestion;

    var content = `<div id="`+containQuestionID+`">
         <div class="Question">
            <div id="question`+countQuestion+`">
                <input type"text" name="question" placeholder="New Question.." required>
                <div class="displayOption">  </div>
                <div class="removeQuestion">
                    <button type="button" onclick="removeQuestion(\'`+containQuestionID+`\')"> <i class="fa fa-trash"></i> Remove Question </button>
                </div>
            </div>
        </div>
    </div>`;
        questionBox.insertAdjacentHTML("beforeend" ,content );  

    checkCreate++;
    countQuestion++;
    applyCss();
}

//handle remove question event 
function removeQuestion(questionID)
{
    document.getElementById(questionID).remove();
    checkCreate--;
    applyCss();
}

function applyCss()
{
    document.getElementById("theRightBackground").style.height ="auto";
    document.getElementById("theLeftBackground").style.height = document.getElementById("theRightBackground").offsetHeight;
    document.getElementById("theLeftBackground").style.backgroundColor="#cccccc";
}

function checkQuestion()
{
    if(checkCreate == 0)
    {
        alert("You did not create any question yet!!!!");
        return false;
    }
    else
    {
        alert("You have created new form!!!!");
        return true;
    }
}