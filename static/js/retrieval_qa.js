// ARRAY TO HOLD ALL QA PAIRS WHEN FETCHED - MASTER ARRAY (STATIC)
var qa_pairs = [];

// ARRAY TO HOLD FILTERED QA PAIRS WHEN FILTER IS APPLIED - CHANGES DYNAMICALLY
var filtered_qa = [];

// FILTER FLAG - TO CHECK IF FILTER IS APPLIED - FOR INDEXING PURPOSES WHEN FILTER IS APPLIED
var filter_flag_QA = false;
    
// FUNCTION TO RETRIEVE AND SHOW ALL INDEPENDENT QA PAIRS
function showAllQA() {

    if (ref_rec.checked) {
        var endpoint = "http://localhost:5001/retrieve_qa/reference"
    }
    else if (generated_rec.checked) {
        var endpoint = "http://localhost:5001/retrieve_qa/generated"
    }

    fetch(endpoint)
    .then(response => response.json())
    .then(data => {

        // WE CREATE A TEMP_QA_PAIRS ARRAY AS THIS FUNCTION WILL BE CALLED AGAIN TO REFRESH THE CONTENT BY RETRIEVING FROM THE DATABASE AGAIN - WE HAVE TO SET THE MASTER ARRAY AGAIN THROUGH THIS TEMP ARRAY
        var temp_qa_pairs = [];

        // FILTER BUTTONS TO FILTER CONTENT - SAME REASONING AS ABOVE
        var topic_filter_check_arr = [];

        var list_temp_str = ""
        var topic_filter_list_str = "<option value='all' selected>Filter Topic...</option>"
        
        for (let index = 0; index < data.length; index++) {
            var element = data[index];
            temp_qa_pairs.push(element);
            var topic = element.topic;
            var question = element.question;
            var answer = element.answer;

            list_temp_str += 
            `
            <li class="list-group-item d-flex justify-content-between align-items-start py-4 px-3">
                <div class="ms-2 me-auto">
                    <div class="fw-bold">${topic} - ${question}</div>
                    <span style="display:inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 60ch">${answer}</span>
                </div>
                <button class="btn btn-sm btn-primary" id="${index}" onclick="editQA(this)">Edit</button>
            </li>
            
            `
            var topic_split = topic.split(", ");

            for (let index = 0; index < topic_split.length; index++) {
                var element = topic_split[index];

                if (element.substring(0,3) == "and") {
                    element = element.substring(4, element.length)
                }

                if (!topic_filter_check_arr.includes(element)) {
                    topic_filter_check_arr.push(element);
                    topic_filter_list_str += 
                    `
                    <option value="${element}">${element}</option>
                    `
                }
            }
        }
    
    qa_pairs = temp_qa_pairs;
    document.getElementById("qa_list").innerHTML = list_temp_str;
    document.getElementById("qa_topic_dropdown").innerHTML = topic_filter_list_str;
    })
    .catch((error) => {
        console.error('Error:', error);
    });

    document.getElementById("all_CS_component").classList.add("d-none");
    document.getElementById("all_indQA_component").classList.remove("d-none");

}

// FUNCTION TO SHOW QA_PAIR CONTENT IN THE LEFT LIST - MADE INTO A FUNCTION AS IT IS ALSO CALLED FROM THE FILTER FUNCTION, REDUCE CODE REPETITION
function load_qa_list(selected_qa_pairs) {
    var list_temp_str = ""

    for (let index = 0; index < selected_qa_pairs.length; index++) {
        var element = selected_qa_pairs[index];
        var topic = element.topic;
        var question = element.question;
        var answer = element.answer;

        list_temp_str += 

        `
        <li class="list-group-item d-flex justify-content-between align-items-start py-4 px-3">
            <div class="ms-2 me-auto">
                <div class="fw-bold">${topic} - ${question}</div>
                <span style="display:inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 60ch">${answer}</span>
            </div>
            <button class="btn btn-sm btn-primary" id="${index}" onclick="editQA(this)">Edit</button>
        </li>
        
        `
    }

    document.getElementById("qa_list").innerHTML = list_temp_str;
}


// FILTER QA PAIRS BY TOPIC
function filterQA() {
    var topic_items = document.getElementById("qa_topic_dropdown").options;
    var selected_topic = topic_items[topic_items.selectedIndex].value;

    filtered_qa = [];

    if (selected_topic == "all") {
        filter_flag_QA = false;
        filtered_qa = qa_pairs;
    }
    else {
        filter_flag_QA = true;
        for (let index = 0; index < qa_pairs.length; index++) {
            var element = qa_pairs[index];
            var topic = element.topic;
            var topic_split = topic.split(", ");
            if (topic_split.includes(selected_topic)) {
                filtered_qa.push(element);
            }
        }
    }
    load_qa_list(filtered_qa);
}

// RESET FILTERS - DISPLAY ALL QA_PAIRS AGAIN
function resetFilterQA() {
    var topic_items = document.getElementById("qa_topic_dropdown").options;
    topic_items.selectedIndex = 0

    filter_flag_QA = false;

    load_qa_list(qa_pairs);
}

// FUNCTION TO TOGGLE BETWEEN EDITING OF QA_PAIR OR JUST VIEWING
function changeModeQA(element) {
    var mode = element.value;
    if (mode == "view") {
        element.value = "edit";
        document.getElementById("ind_qa_topic").disabled = false;
        document.getElementById("ind_qa_ques").disabled = false;
        document.getElementById("ind_qa_ans").disabled = false;
        
        document.getElementById("retrieve_QA_label").innerText = "Editing Mode";
    }

    else {
        element.value = "view";
        document.getElementById("ind_qa_topic").disabled = true;
        document.getElementById("ind_qa_ques").disabled = true;
        document.getElementById("ind_qa_ans").disabled = true;

        document.getElementById("retrieve_QA_label").innerText = "Viewing Mode";
    }
}

// FUNCTION TO SHOW MORE DETAILS OF THE QA_PAIR AND TO ALLOW EDITING OF THE QA_PAIR
function editQA(element) {
    var index = element.id;

    if (filter_flag_QA == true) {
        var qa_pair = filtered_qa[index];
        var topic = qa_pair.topic;
        var question = qa_pair.question;
        var answer = qa_pair.answer;
    }
    else{
        var qa_pair = qa_pairs[index];
        var topic = qa_pair.topic;
        var question = qa_pair.question;
        var answer = qa_pair.answer;
    }

    document.getElementById("ind_qa_topic").value = topic;
    document.getElementById("ind_qa_ques").value = question;
    document.getElementById("ind_qa_ans").value = answer;

    document.getElementById("reset_qa").setAttribute("onclick", `resetQA(${index})`)
    document.getElementById("update_qa").setAttribute("onclick", `updateQA(${index})`)
}

// FUNCTION TO CONNECT TO MONGO MICROSERVICE TO UPDATE THE QA PAIR IN THE DATA BASE
function updateQA(index){

    // USE -1 AS A FLAG TO CHECK IF ANY QA_PAIR IS SELECTED
    if (index == -1) {
        alert("Please select a QA pair to edit.")
        return
    }

    // COLLECT ALL THE DATA FROM THE INPUT AND TEXTAREA FIELDS
    var topic = document.getElementById("ind_qa_topic").value;
    var question = document.getElementById("ind_qa_ques").value;
    var answer = document.getElementById("ind_qa_ans").value;

    // CHECK FLAG TO SEE WHICH ARRAY TO TAKE QA PAIR FROM - MASTER OR FILTERED       
    if (filter_flag_QA == true) {
        var qa_pair = filtered_qa[index];
    }
    else{
        var qa_pair = qa_pairs[index];
    }
    var id = qa_pair._id.$oid;

    // CHECK WHICH CLASSIFICATION IS CHECKED (REFERENCE OR GENERATED)
    if (ref_rec.checked) {
        var update_qa_endpoint = "http://localhost:5001/update_qa/reference/" + id;
    }
    else if (generated_rec.checked) {
        var update_qa_endpoint = "http://localhost:5001/update_qa/generated/" + id;
    }
    
    var data = {
        "topic": topic,
        "question": question,
        "answer": answer
    }

    fetch(update_qa_endpoint, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {

        if (data.code == 200) {
            alert("QA pair updated successfully!");
            // RESET ALL FIELDS, SHOW ALL CASE STUDIES AND RESET FILTERS
            clearQA();
            showAllQA();
            resetFilterQA();
        }
        else if (data.code == 500){
            alert("Error updating QA pair. Please try again.")
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });

}

// FUNCTION TO RESET ANY CHANGES MADE TO THE QA PAIR - DONE THROUGH REFETCHING FROM THE MASTER/FILTERED ARRAY
function resetQA(index){

    // DEFAULT INDEX IS -1 - TO CHECK IF ANY QA_PAIR IS SELECTED
    if (index == -1) {
        clearQA()
    }
    else{
        if (filter_flag_QA == true) {
            var qa_pair = filtered_qa[index];
            var topic = qa_pair.topic;
            var question = qa_pair.question;
            var answer = qa_pair.answer;
        }
        else{
            var qa_pair = qa_pairs[index];
            var topic = qa_pair.topic;
            var question = qa_pair.question;
            var answer = qa_pair.answer;
        }
        document.getElementById("ind_qa_topic").value = topic;
        document.getElementById("ind_qa_ques").value = question;
        document.getElementById("ind_qa_ans").value = answer;
    }
}

// CLEARS THE QA_PAIRS INPUTS
function clearQA() {
    document.getElementById("ind_qa_topic").value = "";
    document.getElementById("ind_qa_ques").value = "";
    document.getElementById("ind_qa_ans").value = "";

    document.getElementById("reset_qa").setAttribute("onclick", `resetQA(-1)`)
    document.getElementById("update_qa").setAttribute("onclick", `updateQA(-1)`)
}