var regen = document.getElementById("regenerate");
regen.addEventListener("click", function() {
    var response = location.reload();
    // console.log(response);
    document.getElementById("loader").setAttribute("class", "text-center");
    window.scrollTo({top: 0, behavior: 'smooth'})
});