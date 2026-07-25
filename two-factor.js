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

document.getElementById("backBtn")
.addEventListener("click",()=>{

    history.back();

});



const enableBtn =
document.getElementById("enableTwoFactor");

const disableBtn =
document.getElementById("disableTwoFactor");

const status =
document.getElementById("twoFactorStatus");



onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href="login.html";
        return;

    }


    const userRef =
    doc(db,"users",user.uid);


    const userSnap =
    await getDoc(userRef);



    if(userSnap.exists()){


        const data =
        userSnap.data();



        if(data.twoFactorEnabled){


            status.textContent =
            "🟢 Two-Step Verification is ON";


        }else{


            status.textContent =
            "🔴 Two-Step Verification is OFF";


        }


    }




    enableBtn.addEventListener("click", async()=>{


        await updateDoc(userRef,{

            twoFactorEnabled:true

        });


        status.textContent =
        "🟢 Two-Step Verification is ON";


        alert("Two-Step Verification enabled.");

    });



    disableBtn.addEventListener("click", async()=>{


        await updateDoc(userRef,{

            twoFactorEnabled:false

        });


        status.textContent =
        "🔴 Two-Step Verification is OFF";


        alert("Two-Step Verification disabled.");

    });



});
