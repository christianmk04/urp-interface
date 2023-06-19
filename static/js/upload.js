var cs_upload_btn = document.getElementById("upload_file_cs");
var qa_upload_btn = document.getElementById("upload_file_qa");
var csqa_upload_btn = document.getElementById("upload_file_csqa");

function upload_cs() {
    document.getElementById("loader").getElementsByTagName("h1")[0].innerHTML = "Uploading file and generating Case Study Now... <br> Generation can take up to 1 minute, please wait!";
    document.getElementById("form_label").setAttribute("class", "form-label text-white d-none");
    document.getElementById("myForm").setAttribute("class", "form d-none");
    document.getElementById("loader").setAttribute("class", "text-center");
}

function upload_qa() {
    document.getElementById("loader").getElementsByTagName("h1")[0].innerHTML = "Uploading file and generating Questions and Answers Now... <br> Generation can take up to 1 minute, please wait!";
    document.getElementById("form_label").setAttribute("class", "form-label text-white d-none");
    document.getElementById("myForm").setAttribute("class", "form d-none");
    document.getElementById("loader").setAttribute("class", "text-center");
}

function upload_csqa() {
    document.getElementById("form_label").setAttribute("class", "form-label text-white d-none");
    document.getElementById("myForm").setAttribute("class", "form d-none");
    document.getElementById("loader").setAttribute("class", "text-center");
}

cs_upload_btn.addEventListener("click", upload_cs);
qa_upload_btn.addEventListener("click", upload_qa);
csqa_upload_btn.addEventListener("click", upload_csqa);