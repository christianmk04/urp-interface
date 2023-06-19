// RESOURCE TYPE RADIO BUTTONS
var retrieve_cs = document.getElementById("retrieve_cs");
var retrieve_csqa = document.getElementById("retrieve_csqa");
var retrieve_qa = document.getElementById("retrieve_qa");

// RESOURCE CLASSIFICATION RADIO BUTTONS
var ref_rec = document.getElementById("ref_rec");
var generated_rec = document.getElementById("generated_rec");
var generated_rec_pdf = document.getElementById("generated_rec_pdf");

function resource_type_change() {
    var resource_type_labels = document.getElementById("resource_type").getElementsByTagName("label");

    if (retrieve_cs.checked) {
        resource_type_labels[0].setAttribute("class", "btn btn-info");
        resource_type_labels[1].setAttribute("class", "btn btn-secondary");
        resource_type_labels[2].setAttribute("class", "btn btn-secondary");
    }
    else if(retrieve_qa.checked) {
        resource_type_labels[0].setAttribute("class", "btn btn-secondary");
        resource_type_labels[1].setAttribute("class", "btn btn-success");
        resource_type_labels[2].setAttribute("class", "btn btn-secondary");
    }
    else if(retrieve_csqa.checked) {
        resource_type_labels[0].setAttribute("class", "btn btn-secondary");
        resource_type_labels[1].setAttribute("class", "btn btn-secondary");
        resource_type_labels[2].setAttribute("class", "btn btn-warning");
    }
}

retrieve_cs.addEventListener("click", resource_type_change);
retrieve_csqa.addEventListener("click", resource_type_change);
retrieve_qa.addEventListener("click", resource_type_change);


function resource_class_change() {
    var resource_class_labels = document.getElementById("resource_class").getElementsByTagName("label");

    if (ref_rec.checked) {
        resource_class_labels[0].setAttribute("class", "btn btn-primary");
        resource_class_labels[1].setAttribute("class", "btn btn-secondary");
        resource_class_labels[2].setAttribute("class", "btn btn-secondary");
    }
    else if(generated_rec.checked) {
        resource_class_labels[0].setAttribute("class", "btn btn-secondary");
        resource_class_labels[1].setAttribute("class", "btn btn-danger");
        resource_class_labels[2].setAttribute("class", "btn btn-secondary");
    }
    else if(generated_rec_pdf.checked) {
        resource_class_labels[0].setAttribute("class", "btn btn-secondary");
        resource_class_labels[1].setAttribute("class", "btn btn-secondary");
        resource_class_labels[2].setAttribute("class", "btn btn-warning");
    }
}

ref_rec.addEventListener("click", resource_class_change);
generated_rec.addEventListener("click", resource_class_change);
generated_rec_pdf.addEventListener("click", resource_class_change);

// TO SHOW CHOSEN RESOURCES
function showResources() {
    if (retrieve_cs.checked) {
        showAllCS();
    } else if (retrieve_csqa.checked) {
        showAllCSQA();
    } else if (retrieve_qa.checked) {
        showAllQA();
    }
}