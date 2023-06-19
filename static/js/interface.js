// MAIN TOPICS (AGILE & DEVOPS) RADIO BUTTONS
var agile = document.getElementById("agile");
var devops = document.getElementById("devops");

function main_topic_change() {
    var main_topic_labels = document.getElementById("main_topic").getElementsByTagName("label");

    if (agile.checked) {
        main_topic_labels[0].setAttribute("class", "btn btn-lg btn-info");
        main_topic_labels[1].setAttribute("class", "btn btn-lg btn-secondary");
    }
    else if(devops.checked) {
        main_topic_labels[0].setAttribute("class", "btn btn-lg btn-secondary");
        main_topic_labels[1].setAttribute("class", "btn btn-lg btn-success");
    }
}

agile.addEventListener("click", main_topic_change);
devops.addEventListener("click", main_topic_change);


// RADIO BUTTONS FOR SUB-TOPICS
var option1 = document.getElementById("option1");
var option2 = document.getElementById("option2");
var option3 = document.getElementById("option3");
var option4 = document.getElementById("option4");
var option5 = document.getElementById("option5");
var option6 = document.getElementById("option6");
var sub_topic_div = document.getElementById("sub_topic_auto");

function radiochange() {
    var sub_topic_buttons = sub_topic_div.getElementsByTagName("input");
    var sub_topic_labels = sub_topic_div.getElementsByTagName("label");

    for (let index = 0; index < sub_topic_buttons.length; index++) {
        if (sub_topic_buttons[index].checked) {
            sub_topic_labels[index].setAttribute("class", "btn btn-sm btn-primary");
        }
        else {
            sub_topic_labels[index].setAttribute("class", "btn btn-sm btn-secondary");
        }
        
    }
}

option1.addEventListener("click", radiochange);
option2.addEventListener("click", radiochange);
option3.addEventListener("click", radiochange);
option4.addEventListener("click", radiochange);
option5.addEventListener("click", radiochange);
option6.addEventListener("click", radiochange);


// TOGGLE BUTTON TO SWITCH MODES

var toggle_button = document.getElementById("modetoggle");

var curr_mode = "automatic";

function toggle_mode() {
    if (curr_mode == "automatic") {
        curr_mode = "manual";
        document.getElementById("modelabel").innerText = "Manual Mode";
        document.getElementById("sub_topic_label").innerText = "Enter in Keyword(s):";
        document.getElementById("sub_topic_auto").setAttribute("style", "display: none;");
        document.getElementById("sub_topic_manual").setAttribute("style", "");
    }
    else {
        curr_mode = "automatic";
        document.getElementById("modelabel").innerText = "Automatic Mode";
        document.getElementById("sub_topic_label").innerText = "Select Sub-Topic:";
        document.getElementById("sub_topic_auto").setAttribute("style", "");
        document.getElementById("sub_topic_manual").setAttribute("style", "display: none;");
    }
}

toggle_button.addEventListener("click", toggle_mode);

