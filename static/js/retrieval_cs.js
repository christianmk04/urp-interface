// ARRAY TO HOLD ALL CASE STUDIES WHEN FETCHED - MASTER ARRAY (STATIC)
var case_studies = [];

// ARRAY TO HOLD FILTERED CASE STUDIES WHEN FILTER IS APPLIED - CHANGES DYNAMICALLY
var filtered_case_studies = []

// FILTER FLAG - TO CHECK IF FILTER IS APPLIED - FOR INDEXING PURPOSES WHEN FILTER IS APPLIED
var filter_flag_CS = false;

// FUNCTION TO RETRIEVE AND SHOW ALL CASE STUDIES
function showAllCS() {

    if (ref_rec.checked) {
        var endpoint = "http://localhost:5001/retrieve_cs/reference";
    }
    else if (generated_rec.checked) {
        var endpoint = "http://localhost:5001/retrieve_cs/generated";
    }

    fetch(endpoint)
    .then(response => response.json())
    .then(data => {

        // WE CREATE A TEMP_CASE_STUDIES ARRAY AS THIS FUNCTION WILL BE CALLED AGAIN TO REFRESH THE CONTENT BY RETRIEVING FROM THE DATABASE AGAIN - WE HAVE TO SET THE MASTER ARRAY AGAIN THROUGH THIS TEMP ARRAY
        var temp_case_studies = [];

        // FILTER BUTTONS TO FILTER CONTENT - SAME REASONING AS ABOVE
        var main_filter_check_arr = [];
        var sub_filter_check_arr = [];

        var list_temp_str = ""
        var main_filter_list_str = "<option value='all' selected>Filter Main Topic</option>"
        var sub_filter_list_str = "<option value='all' selected>Filter Sub-Topic</option>"

        
        for (let index = 0; index < data.length; index++) {
            var element = data[index];
            temp_case_studies.push(element);
            var main_topic = element.main_topic;
            var sub_topic = element.sub_topic;
            var case_study = element.content;

            list_temp_str += 
            `
            <li class="list-group-item d-flex justify-content-between align-items-start py-4 px-3">
                <div class="ms-2 me-auto">
                    <div class="fw-bold">${main_topic} - ${sub_topic}</div>
                    ${case_study.substring(0,101)}...
                </div>
                <button class="btn btn-sm btn-primary" id="${index}" onclick="showCS(this)">Edit</button>
            </li>
            
            `
            var main_topic_split = main_topic.split(", ");

            for (let index = 0; index < main_topic_split.length; index++) {
                var element = main_topic_split[index];

                element = element.trim();

                if (!main_filter_check_arr.includes(element)) {
                    main_filter_check_arr.push(element);
                    main_filter_list_str += 
                    `
                    <option value="${element}">${element}</option>
                    `
                }
            }

            var sub_topic_split = sub_topic.split(", ");
            for (let index = 0; index < sub_topic_split.length; index++) {
                var element = sub_topic_split[index];

                if (element.substring(0,3) == "and") {
                    element = element.substring(4, element.length)
                }

                element = element.trim();

                if (!sub_filter_check_arr.includes(element)) {
                    sub_filter_check_arr.push(element);
                    sub_filter_list_str += 
                    `
                    <option value="${element}">${element}</option>
                    `
                }
            }
        }

        case_studies = temp_case_studies;

        document.getElementById("case_study_listCS").innerHTML = list_temp_str;
        document.getElementById("main_topic_dropdown_CS").innerHTML = main_filter_list_str;
        document.getElementById("sub_topic_dropdown_CS").innerHTML = sub_filter_list_str;
        document.getElementById("case_study_textarea").setAttribute("rows", data.length)
    })
    .catch(error => console.log(error));

    document.getElementById("all_CS_component").classList.remove("d-none");
    document.getElementById("all_indQA_component").classList.add("d-none");
}

// FUNCTION TO SHOW CASE STUDY CONTENT IN THE LEFT LIST - MADE INTO A FUNCTION AS IT IS ALSO CALLED FROM THE FILTER FUNCTION, REDUCE CODE REPETITION
function load_cs_list(selected_case_studies) {
    var list_temp_str = ""

    for (let index = 0; index < selected_case_studies.length; index++) {
        var element = selected_case_studies[index];
        var main_topic = element.main_topic;
        var sub_topic = element.sub_topic;
        var case_study = element.content;

        list_temp_str += 

        `
        <li class="list-group-item d-flex justify-content-between align-items-start py-4 px-3">
            <div class="ms-2 me-auto">
                <div class="fw-bold">${main_topic} - ${sub_topic}</div>
                ${case_study.substring(0,101)}...
            </div>
            <button class="btn btn-sm btn-primary" id="${index}" onclick="showCS(this)">Edit</button>
        </li>
        
        `
    }
    document.getElementById("case_study_listCS").innerHTML = list_temp_str;
}

// FILTER CASE STUDIES
function filterCS() {

    // FILTERS FOR CS DROPDOWN
    var main_topic_dropdown = document.getElementById("main_topic_dropdown_CS");
    var sub_topic_dropdown = document.getElementById("sub_topic_dropdown_CS");

    var main_topic_items = main_topic_dropdown.options
    var main_selected_index = main_topic_items.selectedIndex
    var main_value = main_topic_items[main_selected_index].value

    var sub_topic_items = sub_topic_dropdown.options
    var sub_selected_index = sub_topic_items.selectedIndex
    var sub_value = sub_topic_items[sub_selected_index].value

    filtered_case_studies = []

    if (main_value == "all" && sub_value == "all") {
        filter_flag_CS = false;
        filtered_case_studies = case_studies
    } else if (main_value == "all" && sub_value != "all") {
        filter_flag_CS = true;
        for (let index = 0; index < case_studies.length; index++) {
            var element = case_studies[index];
            var sub_topic = element.sub_topic;
            var sub_topic_split = sub_topic.split(", ");
            if (sub_topic_split.includes(sub_value)) {
                filtered_case_studies.push(element)
            }
        }
    } else if (main_value != "all" && sub_value == "all") {
        filter_flag_CS = true;
        for (let index = 0; index < case_studies.length; index++) {
            var element = case_studies[index];
            var main_topic = element.main_topic;
            var main_topic_split = main_topic.split(", ");
            if (main_topic_split.includes(main_value)) {
                filtered_case_studies.push(element)
            }
        }
    } else {
        filter_flag_CS = true;
        for (let index = 0; index < case_studies.length; index++) {
            var element = case_studies[index];
            var main_topic = element.main_topic;
            var sub_topic = element.sub_topic;
            var main_topic_split = main_topic.split(", ");
            var sub_topic_split = sub_topic.split(", ");
            if (main_topic_split.includes(main_value) && sub_topic_split.includes(sub_value)) {
                filtered_case_studies.push(element)
            }
        }
    }
    load_cs_list(filtered_case_studies)
}

// RESET FILTERS - DISPLAY ALL CASE STUDIES AGAIN
function resetFilterCS() {
    var main_topic_items = main_topic_dropdown.options
    main_topic_items.selectedIndex = 0

    var sub_topic_items = sub_topic_dropdown.options
    sub_topic_items.selectedIndex = 0

    filter_flag_CS = false;

    load_cs_list(case_studies)
}

// FUNCTION TO TOGGLE BETWEEN EDITING OF CASE STUDIES OR JUST VIEWING
function changeModeCS(element) {
    var mode = element.value;
    if (mode == "view") {
        element.value = "edit";
        document.getElementById("cs_main_topic").disabled = false;
        document.getElementById("cs_sub_topic").disabled = false;
        document.getElementById("case_study_textarea").disabled = false;
        
        document.getElementById("retrieve_CS_label").innerText = "Editing Mode";
    }

    else {
        element.value = "view";
        document.getElementById("cs_main_topic").disabled = true;
        document.getElementById("cs_sub_topic").disabled = true;
        document.getElementById("case_study_textarea").disabled = true;

        document.getElementById("retrieve_CS_label").innerText = "Viewing Mode";
    }
}

// FUNCTION TO SHOW MORE OF THE CASE STUDY AND TO ALLOW EDITING OF THE CASE STUDY
function showCS(element) {
    var index = element.id;

    if (filter_flag_CS == true) {
        var id = filtered_case_studies[index]._id.$oid
        var case_study = filtered_case_studies[index].content;
        var main_topic = filtered_case_studies[index].main_topic;
        var sub_topic = filtered_case_studies[index].sub_topic;
    }
    else{
        var id = case_studies[index]._id.$oid
        var case_study = case_studies[index].content;
        var main_topic = case_studies[index].main_topic;
        var sub_topic = case_studies[index].sub_topic;
    }

    // FOR EDITING OF RELATED CSQA
    document.getElementById("cs_id").value = id;
    if (ref_rec.checked) {
        document.getElementById("cs_classification").value = "reference"
    }
    else if (generated_rec.checked) {
        document.getElementById("cs_classification").value = "generated"
    }
    document.getElementById("edit_csqa_button").disabled = false;

    // DISPLAY ALL VALUES IN THE FORM ON THE RIGHT SIDE
    document.getElementById("cs_main_topic").value = main_topic;
    document.getElementById("cs_sub_topic").value = sub_topic;
    document.getElementById("case_study_textarea").value = case_study;

    // CHANGE THE BUTTONS TO UPDATE AND RESET BASED ON INDEX
    document.getElementById("reset_cs").setAttribute("onclick", `resetCS(${index})`)
    document.getElementById("update_cs").setAttribute("onclick", `updateCS(${index})`)
}

// FUNCTION TO CONNECT TO MONGO MICROSERVICE TO UPDATE THE CASE STUDY IN THE DATA BASE
function updateCS(index) {

    // USE -1 AS A FLAG TO CHECK IF ANY CASE STUDY IS SELECTED
    if (index == -1) {
        alert("Please select a case study by clicking 'Show More' !")
        return
    }

    // COLLECT ALL THE DATA FROM THE INPUT AND TEXTAREA FIELDS
    var curr_case_study = document.getElementById("case_study_textarea").value;
    var main_topic = document.getElementById("cs_main_topic").value;
    var sub_topic = document.getElementById("cs_sub_topic").value;

    // CHECK FLAG TO SEE WHICH ARRAY TO TAKE CASE STUDY FROM - MASTER OR FILTERED
    if (filter_flag_CS == true) {
        var id = filtered_case_studies[index]._id.$oid
    }
    else{
        var id = case_studies[index]._id.$oid
    }
        

    // CHECK WHICH CLASSIFICATION IS CHECKED (REFERENCE OR GENERATED)
    if(ref_rec.checked){
        var update_cs_endpoint = "http://localhost:5001/update_cs/reference/" + id;
    }
    else if(generated_rec.checked){
        var update_cs_endpoint = "http://localhost:5001/update_cs/generated/" + id;
    }

    var data = {
        "main_topic": main_topic,
        "sub_topic": sub_topic,
        "cs_content": curr_case_study
    }

    fetch(update_cs_endpoint, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.code == 200){
            alert("Case Study Updated Successfully!")
            // RESET ALL FIELDS, SHOW ALL CASE STUDIES AND RESET FILTERS
            clearCS()
            showAllCS()
            resetFilterCS()
        }
        else if(data.code == 500){
            alert("Error in updating case study! Please Try Again!")
        }
    })
    .catch(error => {
        console.log(error)
    })
}

// FUNCTION TO RESET ANY CHANGES MADE TO THE CASE STUDY - DONE THROUGH REFETCHING FROM THE MASTER/FILTERED ARRAY
function resetCS(index) {

    // DEFAULT INDEX IS -1 - TO CHECK IF ANY CASE STUDY IS SELECTED
    if (index == -1) {
        clearCS()
    }
    else{
        if (filter_flag_CS == true) {
            var case_study = filtered_case_studies[index].content;
            var main_topic = filtered_case_studies[index].main_topic;
            var sub_topic = filtered_case_studies[index].sub_topic;
        }
        else{
            var case_study = case_studies[index].content;
            var main_topic = case_studies[index].main_topic;
            var sub_topic = case_studies[index].sub_topic;
        }
        document.getElementById("cs_main_topic").value = main_topic;
        document.getElementById("cs_sub_topic").value = sub_topic;
        document.getElementById("case_study_textarea").value = case_study;
    }
}

// CLEARS THE CASE STUDY INPUTS
function clearCS() {
    document.getElementById("cs_main_topic").value = "";
    document.getElementById("cs_sub_topic").value = "";
    document.getElementById("case_study_textarea").value = ""

    document.getElementById("reset_cs").setAttribute("onclick", `resetCS(-1)`)
    document.getElementById("update_cs").setAttribute("onclick", `updateCS(-1)`)
}