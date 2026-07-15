// Load saved theme

if(localStorage.getItem("darkMode") === "enabled"){

    document.body.classList.add("dark-mode");

}


// Function for changing theme

window.toggleDarkMode = function(enabled){

    if(enabled){

        document.body.classList.add("dark-mode");

        localStorage.setItem(
            "darkMode",
            "enabled"
        );

    }else{

        document.body.classList.remove("dark-mode");

        localStorage.setItem(
            "darkMode",
            "disabled"
        );

    }

};
