/* ==================================
   MATCHCONNECT GLOBAL THEME SYSTEM
   theme.js
================================== */


// Load saved theme when any page opens

const savedTheme =
localStorage.getItem("darkMode");


if(savedTheme === "enabled"){

    document.body.classList.add("dark-mode");

}



// Function called by Settings switch

window.toggleDarkMode = function(enabled){


    if(enabled){

        document.body.classList.add(
            "dark-mode"
        );


        localStorage.setItem(
            "darkMode",
            "enabled"
        );


    }else{


        document.body.classList.remove(
            "dark-mode"
        );


        localStorage.setItem(
            "darkMode",
            "disabled"
        );

    }

};
