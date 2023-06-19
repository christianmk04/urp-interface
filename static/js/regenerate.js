var regen = document.getElementById("regenerate");
regen.addEventListener("click", function() {
    var response = location.reload();
    // console.log(response);
    document.getElementById("loader").setAttribute("class", "text-center");

    document.getElementById("regenerate").disabled = true;
    document.getElementById("upload_new").disabled = true;
    window.scrollTo({top: 0, behavior: 'smooth'})
});