const urlParams = new URLSearchParams(window.location.search);
const cs_id = urlParams.get('cs_id');
const classification = urlParams.get('cs_classification');

var qa_list =  []

function fetchAll() {
    var mongo_endpoint = "http://localhost:5001/retrieve_csqa_set/" + classification +  "/" + cs_id;
    fetch(mongo_endpoint)
    .then(response => response.json())
    .then(data => {
        cs_data = data[0][0]
        cs_content = cs_data['content']
        cs_main_topic = cs_data['main_topic']
        cs_sub_topic = cs_data['sub_topic']

        document.getElementById("case_study_textarea").value = cs_content;
        document.getElementById("cs_main_topic").value = cs_main_topic;
        document.getElementById("cs_sub_topic").value = cs_sub_topic;

        // NEED THIS TEMP LIST TO REFRESH THE LIST WITHOUT ADDING NEW STUFF
        var temp_qa_pair_list = []

        var qa_str = "";
        qa_data = data[1]
        for (let index = 0; index < qa_data.length; index++) {
            const element = qa_data[index];
            temp_qa_pair_list.push(element)
            qa_main_topic = element['main_topic']
            qa_sub_topic = element['sub_topic']
            qa_ques = element['question']
            qa_ans = element['answer']

            qa_str += 
            `
            <li class="list-group-item d-flex justify-content-between align-items-start p-3">
                <div class="ms-2 me-auto">
                    <div class="fw-bold">${qa_main_topic} - ${qa_sub_topic}</div>
                    Q: ${qa_ques} <br><br>
                    A: ${qa_ans}
                </div>
                <button class="btn btn-sm btn-primary" onclick="editQA(${index})">Edit</span>
            </li>
            
            `
        }   

        qa_list = temp_qa_pair_list
        if (qa_list.length == 0) {
            document.getElementById("no_qa_show_div").classList.remove("d-none")
        }
        else{
            document.getElementById("qa_list").innerHTML = qa_str;
        }

        

    })
    .catch(error => {
        console.log(error);
    });
}

// CALL UPON FIRST LOAD
fetchAll()


function editQA(index) {
        var qa_pair = qa_list[index]
        qa_main_topic = qa_pair['main_topic']
        qa_sub_topic = qa_pair['sub_topic']
        qa_ques = qa_pair['question']
        qa_ans = qa_pair['answer']

        document.getElementById("csqa_main_topic").value = qa_main_topic;
        document.getElementById("csqa_sub_topic").value = qa_sub_topic;
        document.getElementById("csqa_ques").value = qa_ques;
        document.getElementById("csqa_ans").value = qa_ans;

        document.getElementById("reset_qa").setAttribute("onclick", `resetQA(${index})`)
        document.getElementById("update_qa").setAttribute("onclick", `updateQA(${index})`)
}

function resetQA(index) {
    if (index == -1) {
        clearQA()
    }
    editQA(index)
}

function clearQA() {
    document.getElementById("csqa_main_topic").value = "";
    document.getElementById("csqa_sub_topic").value = "";
    document.getElementById("csqa_ques").value = "";
    document.getElementById("csqa_ans").value = "";

    document.getElementById("reset_qa").setAttribute("onclick", "resetQA(-1)")
}

function updateQA(index) {
    var qa_pair = qa_list[index];
    qa_id = qa_pair['id']

    var new_qa_main_topic = document.getElementById("csqa_main_topic").value;
    var new_qa_sub_topic = document.getElementById("csqa_sub_topic").value;
    var new_qa_ques = document.getElementById("csqa_ques").value;
    var new_qa_ans = document.getElementById("csqa_ans").value;

    var mongo_endpoint = "http://localhost:5001/update_csqa_set/" + classification +  "/" + qa_id;

    var data = {
        "main_topic": new_qa_main_topic,
        "sub_topic": new_qa_sub_topic,
        "question": new_qa_ques,
        "answer": new_qa_ans
    }

    fetch(mongo_endpoint, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        if (data.code == 200) {
            alert("QA Pair Updated Successfully!")
            fetchAll()
            clearQA()
        }
        else{
            alert("Error Occured!")
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}