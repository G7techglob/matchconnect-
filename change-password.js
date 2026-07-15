import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// Back button

document.getElementById("backBtn").addEventListener("click",()=>{

    history.back();

});


// Get elements

const currentPassword =
document.getElementById("currentPassword");

const newPassword =
document.getElementById("newPassword");

const confirmPassword =
document.getElementById("confirmPassword");

const savePasswordBtn =
document.getElementById("savePasswordBtn");


// Update password

savePasswordBtn.addEventListener("click", async()=>{


    const user = auth.currentUser;


    if(!user){

        alert("You are not logged in.");
        return;

    }


    const oldPassword =
    currentPassword.value.trim();


    const password =
    newPassword.value.trim();


    const confirm =
    confirmPassword.value.trim();



    if(!oldPassword || !password || !confirm){

        alert("Please fill all fields.");
        return;

    }


    if(password !== confirm){

        alert("New passwords do not match.");
        return;

    }


    if(password.length < 6){

        alert("Password must be at least 6 characters.");
        return;

    }



    try{


        // Verify old password first

        const credential =
        EmailAuthProvider.credential(
            user.email,
            oldPassword
        );


        await reauthenticateWithCredential(
            user,
            credential
        );


        // Change password

        await updatePassword(
            user,
            password
        );


        alert("Password updated successfully.");

        window.location.href="settings.html";


    }
    catch(error){

        console.error(error);


        if(error.code === "auth/wrong-password"){

            alert("Current password is incorrect.");

        }
        else{

            alert(error.message);

        }

    }


});
