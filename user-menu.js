const menuBtn = document.getElementById("menuBtn");

const profileMenu = document.getElementById("profileMenu");



if(menuBtn && profileMenu){


    // Open menu

    menuBtn.addEventListener("click",(e)=>{


        e.stopPropagation();


        profileMenu.classList.toggle("show");


    });



    // Close when clicking outside

    document.addEventListener("click",(e)=>{


        if(
            !profileMenu.contains(e.target) &&
            !menuBtn.contains(e.target)
        ){

            profileMenu.classList.remove("show");

        }


    });


}
