var copy_cs = document.getElementById("copycs")
var copy_qn = document.getElementById("copyqn")
var copy_ans = document.getElementById("copyans")

var cstext = document.getElementById("cstext");
var qtext = document.getElementById("qtext");
var atext = document.getElementById("atext");

function copy_cs_fn() {

    // Select the text field
    cstext.select();
    cstext.setSelectionRange(0, 99999);

    // Cpoy the text inside the text field
    navigator.clipboard.writeText(cstext.value);

    cstext.setSelectionRange(0, 0);

    // ALert the copied Text
    alert("Copied the Case Study to Clipboard!");
}

function copy_qn_fn() {

    // Select the text field
    qtext.select();
    qtext.setSelectionRange(0, 99999);

    // Cpoy the text inside the text field
    navigator.clipboard.writeText(cstext.value);

    qtext.setSelectionRange(0, 0);

    // ALert the copied Text
    alert("Copied the Questions to Clipboard!");
    
}

function copy_ans_fn() {
    // Select the text field
    atext.select();
    atext.setSelectionRange(0, 99999);

    // Cpoy the text inside the text field
    navigator.clipboard.writeText(cstext.value);

    atext.setSelectionRange(0, 0);

    // ALert the copied Text
    alert("Copied the Answers to Clipboard!");
}

copy_cs.addEventListener("click", copy_cs_fn);
copy_qn.addEventListener("click", copy_qn_fn);
copy_ans.addEventListener("click", copy_ans_fn);