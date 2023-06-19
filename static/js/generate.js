var agile = document.getElementById("agile");
var devops = document.getElementById("devops");
var casestudy = document.getElementById("cs");
var quesans = document.getElementById("qa");
var caseques = document.getElementById("csqa");

// FLAG FOR GENERATED CASE STUDY & CURRENT CASE STUDY IF GENERATED;
var generated_cs = false;
var curr_case_study = ""; 


// GENERATE AND RESET BUTTONS

var csgenerate = document.getElementById("csgenerate");
var qagenerate = document.getElementById("qagenerate");
var csqagenerate = document.getElementById("csqagenerate");
var reset = document.getElementById("reset");
var cstext = document.getElementById("cstext");
var qtext = document.getElementById("qtext");
var atext = document.getElementById("atext");

// MESSAGE GENERATION + SUB-TOPICS
var messages = [
    {"role": "system", "content": "You are an instructor teaching a course in Agile and DevOps practices. Your job is to generate quiz questions for the purpose of assessment."},
    {"role": "user", "content": ""},
    {"role": "assistant", "content": ""},
    {"role": "user", "content": ""}
]

function reset_messages() {
    messages = 
    [
        {"role": "system", "content": "You are an instructor teaching a course in Agile and DevOps practices. Your job is to generate quiz questions for the purpose of assessment."},
        {"role": "user", "content": ""},
        {"role": "assistant", "content": ""},
        {"role": "user", "content": ""}
    ]
}

var sub_topics = {
    "option1" : "Automation",
    "option2" : "Software Design",
    "option3" : "Version Control",
    "option4" : "Software Lifecycle",
    "option5" : "Agile Methodologies",
    "option6" : "Software Security",
}

// API CALL TO OPENAI GPT-3.5 TUBRO

// require('dotenv').config()

// const API_KEY = "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";
// var API_KEY = process.env.api_key;

function retrieve_API_key() {

    var return_var = document.getElementById("api_key").value;
    if (return_var == "") {
        return false;
    }
    else{
        return return_var;
    }
}


async function fetchData(resource, API_KEY) {

    console.log(messages);
    if (resource == "a") {
        atext.innerHTML = `Answers for the questions generated will be displayed here. Please wait for a moment...`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 1.1,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 1
        })
    })

    const data = await response.json()

    if (resource == "cs") {
        cstext.innerHTML = data.choices[0].message.content;
        curr_case_study = data.choices[0].message.content;
        reset_messages();
    }
    else if (resource == "q") {
        qtext.innerHTML = data.choices[0].message.content;  
        
        messages.push({
            "role" : "assistant", "content" : data.choices[0].message.content
        })
        messages.push({
            "role" : "user", "content" : "Please provide the answers to these questions. Keep each answer to 50 words. Follow the same sequencing when you answer the questions. Skip pleasantries of greetings and salutations and immediately provide the answers, meaning do not start with 'Sure, here are the answers to the questions ... ' "
        })
    }
    else if (resource == "a"){
        atext.innerHTML = data.choices[0].message.content;
        reset_messages();
    }
};

// TO CHECK WHICH RADIO BUTTONS ARE CHECKED: (AGILE OR DEVOPS) AND (SUB-TOPICS)

function checkItems() {
    API_KEY = retrieve_API_key();

    if (API_KEY == false) {
        window.scrollTo({top: 0, behavior: 'smooth'})
        alert("Please enter your API key!");
        return false;
    }

    var curr_main_topic = "";
    if (agile.checked) {
        curr_main_topic = "Agile";
    }
    else if (devops.checked) {
        curr_main_topic = "DevOps";
    }

    var curr_sub_topic = "";
    console.log(curr_mode);
    if (curr_mode == "automatic") {
        var sub_topic = document.getElementById("sub_topic_auto");
        var sub_topic_buttons = sub_topic.getElementsByTagName("input");
        for(sub of sub_topic_buttons){
            if (sub.checked) {
                curr_sub_topic = sub_topics[sub.id];
            }
        }
    }
    else{
        if (tags.length == 0) {
            window.scrollTo({top: 0, behavior: 'smooth'})
            alert("Please enter at least 1 keyword!")
            return false;
        }

        var temp_str = "";
        console.log(tags);
        for (let index = 0; index < tags.length; index++) {
            
            if (index != tags.length - 1) {
                temp_str += tags[index] + ", ";
            }
            else{
                temp_str += "and " + tags[index];
            }
            
        }

        curr_sub_topic = temp_str;
    }
    return [curr_main_topic, curr_sub_topic, API_KEY];
}

// GENERATE CASE STUDY
function generate_cs() {

    var items = checkItems();
    if (items == false) {
        return;
    }
    var main_topic = items[0];
    var sub_topic = items[1];
    var API_KEY = items[2];

    var mongo_cs_gen_end_point = `http://localhost:5001/get_case_study/${curr_mode}/${main_topic}/${sub_topic}`;
    var mongo_cs = ""

    // TO SHOW LOADING ANIMATION
    document.getElementById("loader").setAttribute("class" ,"text-center");
    document.getElementById("loader").getElementsByTagName("h1")[0].innerHTML = `Generating Case Study for ${sub_topic} under ${main_topic}, please wait for a moment...`;

    cstext.innerHTML = "";

    window.scrollTo({top: 0, behavior: 'smooth'})

    fetch(mongo_cs_gen_end_point)
    .then(response => response.json())
    .then(data => {
        mongo_cs = data.data[0]["content"];
        console.log(mongo_cs);

        messages[0].content = `You are an instructor teaching a course in ${main_topic} practices. Your job is to generate Case Studies for the following topic(s): ${sub_topic}, where the purpose of the case studies is to be used as an examinable case study in which exam questions can be generated from it.`;
        if (curr_mode == "automatic") {
            messages[1].content = `Please write a case study for ${main_topic} that has aspects of ${sub_topic}`;
        }
        else if (curr_mode == "manual"){
            messages[1].content = `Please write a case study for ${main_topic}`;
        }

        messages[2].content = mongo_cs;

        messages[3].content = `Please write another case study for ${main_topic} that has aspects of ${sub_topic} that is of the same structure as the one that was just generated. Use same/similar concepts and tools that were mentioned in the previous case study. Follow the same structure as the previous case study. Keep the case study to 500 words.`;

    })
    .then(() => fetchData("cs", API_KEY))
    .then(() => {
        // STOP LOADER FROM SHOWING
        document.getElementById("loader").setAttribute("class" ,"text-center d-none");
    })
    .then(() => upload_cs())
    .catch(err => {
        console.log(err);
    })
    generated_cs = true;
}

// GENERATE INDEPENDENT QUESTIONS AND ANSWERS

function generate_qa() {

    qtext.innerHTML = "";
    atext.innerHTML = "";
    
    var items = checkItems();
    if (items == false) {
        return;
    }
    var main_topic = items[0];
    var sub_topic = items[1];
    var API_KEY = items[2];

    // TO SHOW LOADING ANIMATION
    document.getElementById("loader").setAttribute("class" ,"text-center");
    document.getElementById("loader").getElementsByTagName("h1")[0].innerHTML = `Generating Questions for ${sub_topic} under ${main_topic}, please wait for a moment...`;

    window.scrollTo({top: 0, behavior: 'smooth'})

    var mongo_end_point = `http://localhost:5001/get_ind_questions/${curr_mode}/${sub_topic}`;

    fetch(mongo_end_point)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        var question_list = data.data;
        var prompt_qns = "";
        for (let index = 0; index < question_list.length; index++) {
            prompt_qns += `${index + 1}. ${question_list[index]["question"]}\n`;
        }

        console.log(prompt_qns);

        messages[0].content = `You are an instructor teaching a course in ${main_topic} practices. Your job is to generate quiz questions for the purpose of assessment of students taking this course.`;

        messages[1].content = `Please write some questions for ${main_topic} that has aspects of ${sub_topic}.`;

        messages[2].content = prompt_qns;

        messages[3].content = `Please write 10 questions for ${main_topic} that has aspects of ${sub_topic} that uses same/similar concepts, aspects and tools that were mentioned in the previous generated questions. Generate the questions in the same format as how you had previously generated the questions. Skip the pleasantries of acknowledging the request and just provide the questions straight. Do not start of with a greeting or salutation, meaning do not start off with "Sure, here are 10 quiz questions..." or "Sure, here are 10 more quiz questions...". `;
    })
    .then(() => fetchData("q", API_KEY))
    .then(() => {
        // CHANGE THE LOADING TO ANSWER GENERATION
        document.getElementById("loader").getElementsByTagName("h1")[0].innerHTML = `Generating Answers for the Generated Questions, please wait for a moment...`;
    })
    .then(() => fetchData("a", API_KEY))
    .then(() => {
        // STOP LOADER FROM SHOWING
        document.getElementById("loader").setAttribute("class" ,"text-center d-none");
    })
    .then(() => upload_ind_qa())
    .catch(err => {
        console.log(err);
    }) 
}

// GENERATE CASE STUDY + RELATED QUESTIONS AND ANSWERS
function generate_csqa() {

    if (generated_cs != true) {
        alert("Please generate a case study first!");
    }
    else{
        qtext.innerHTML = "";
        atext.innerHTML = "";
        console.log(curr_case_study);
        var items = checkItems();
        if (items == false) {
            return;
        }
        var main_topic = items[0];
        var sub_topic = items[1];
        var API_KEY = items[2];

        // TO SHOW LOADING ANIMATION
        document.getElementById("loader").setAttribute("class" ,"text-center");
        document.getElementById("loader").getElementsByTagName("h1")[0].innerHTML = `Generating Questions for ${sub_topic} under ${main_topic} for the case study. Please wait for a moment...`;

        window.scrollTo({top: 0, behavior: 'smooth'})

        var mongo_end_point = `http://localhost:5001/get_csqa/${curr_mode}/${main_topic}/${sub_topic}`;

        fetch(mongo_end_point)
        .then(response => response.json())
        .then(data => {
            console.log(data);

            mongo_case_study = data["case_study"];
            questions_list = data["questions"];
            var reference_cs_qns = "";
            for (let index = 0; index < questions_list.length; index++) {
                reference_cs_qns += `${index + 1}. ${questions_list[index]}\n`;
            }

            messages[0].content = `You are an instructor teaching a course in ${main_topic} practices. Your job is to generate quiz questions for the purpose of assessment of students taking this course.`;

            messages[1].content = `Please write a case study for ${main_topic} that has aspects of ${sub_topic}.`;
    
            messages[2].content = mongo_case_study;
    
            messages[3].content = `Please write a few questions for the case study above that features ${main_topic}.`
    
            messages.push({
                "role" : "assistant", "content" : reference_cs_qns
            })
    
            messages.push(
                {"role": "user", "content": `Given the case study below, please write 10 questions for the case study on ${main_topic} that has aspects of ${sub_topic} that uses same/similar concepts, aspects and tools that were mentioned in the previous generated questions.
        
                Write the questions in the following format:
                1. Question 1
                2. Question 2
                3. Question 3
            
                and so on.
    
                Skip pleasantries of acknowledging the user's requests and get straight to your responses.
    
                The case study is as follows: 
    
                ${curr_case_study}
                
                `}
            );

        })
        .then(() => fetchData("q" , API_KEY))
        .then(() => {
            // CHANGE THE LOADING TO ANSWER GENERATION
            document.getElementById("loader").getElementsByTagName("h1")[0].innerHTML = `Generating Answers for the Generated Questions, please wait for a moment...`;
        })
        .then(() => fetchData("a", API_KEY))
        .then(() => {
            // STOP LOADER FROM SHOWING
            document.getElementById("loader").setAttribute("class" ,"text-center d-none");
        })
        .then(() => upload_csqa())
        .catch(err => {
            console.log(err);
        }) 
    }
}

csgenerate.addEventListener("click", generate_cs);
csqagenerate.addEventListener("click", generate_csqa);
qagenerate.addEventListener("click", generate_qa);


// UPLOADING FUNCTIONS - FUNCTIONS TO UPLOAD THE GENERATED CONTENT INTO THE DATABASE

// FUNCTION TO CALL MONGO ENDPOINT TO UPLOAD JUST GENERATED CASE STUDY TO DB 
function upload_cs() {

    var input_cs = document.getElementById("cstext").innerHTML;

    var items = checkItems();
    if (items == false) {
        return;
    }
    var main_topic = items[0];
    var sub_topic = items[1];

    var json_data = JSON.stringify({
        content: input_cs,
        mode: curr_mode,
        main_topic: main_topic,
        sub_topic: sub_topic
    });

    var mongo_end_point = `http://localhost:5001/upload_cs`;

    fetch(mongo_end_point, 
        {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: json_data   
        })
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(err => {
        console.log(err);
    }) 
}

// FUNCTION TO CALL MONGO ENDPOINT TO UPLOAD GENERATED QUESTIONS AND ANSWERS FOR ALREADY GENERATED CASE STUDY TO DB
function upload_csqa() {

    var input_cs = document.getElementById("cstext").innerHTML;
    var input_q = document.getElementById("qtext").innerHTML;
    var input_a = document.getElementById("atext").innerHTML;

    var items = checkItems();
    if (items == false) {
        return;
    }
    var main_topic = items[0];
    var sub_topic = items[1];

    var json_data = JSON.stringify({
        content: input_cs,
        questions: input_q,
        answers: input_a,
        mode: curr_mode,
        main_topic: main_topic,
        sub_topic: sub_topic
    });

    var mongo_end_point = `http://localhost:5001/upload_qa_for_cs`;

    fetch(mongo_end_point, 
        {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: json_data   
        })
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(err => {
        console.log(err);
    }) 
}

// FUNCTION TO CALL MONGO ENDPOINT TO UPLOAD INDEPENDENT GENERATED QUESTIONS AND ANSWERS TO DB
function upload_ind_qa() {
    var input_q = document.getElementById("qtext").innerHTML;
    var input_a = document.getElementById("atext").innerHTML;

    var items = checkItems();
    if (items == false) {
        return;
    }
    var main_topic = items[0];
    var sub_topic = items[1];

    var json_data = JSON.stringify({
        questions: input_q,
        answers: input_a,
        mode: curr_mode,
        main_topic: main_topic,
        sub_topic: sub_topic
    });

    var mongo_end_point = `http://localhost:5001/upload_ind_qa`;

    fetch(mongo_end_point, 
        {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: json_data   
        })
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(err => {
        console.log(err);
    }) 
}

// RESET ALL TEXT CONTENT & RESET MESSAGE BOXES
function reset_all() {
    cstext.innerHTML = "";
    qtext.innerHTML = "";
    atext.innerHTML = "";
    generated_cs = false;
    reset_messages();
}

reset.addEventListener("click", reset_all);
