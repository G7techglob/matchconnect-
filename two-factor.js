import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    updateDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// Back button

const backBtn = document.getElementById("backBtn");

backBtn.addEventListener("click",()=>{

    history.back();

});


// Button

const enableTwoFactor =
document.getElementById("enableTwoFactor");


// Check user

onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href="login.html";

        return;

    }


    enableTwoFactor.addEventListener("click", async()=>{


        try{


            await updateDoc(
                doc(db,"users",user.uid),
                {
                    twoFactorEnabled:true
                }
            );


            alert(
                "Two-Step Verification enabled successfully."
            );


        }
        catch(error){

            console.error(error);

            alert(error.message);

        }


    });


});
