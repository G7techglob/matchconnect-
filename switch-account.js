import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// Back button

document.getElementById("backBtn").onclick = () => {

    history.back();

};



const profileImage =
document.getElementById("profileImage");

const displayName =
document.getElementById("displayName");

const email =
document.getElementById("email");



const addAccountBtn =
document.getElementById("addAccountBtn");


const logoutBtn =
document.getElementById("logoutBtn");




// Load current account

onAuthStateChanged(auth,(user)=>{


    if(!user){

        window.location.href="login.html";

        return;

    }



    email.textContent =
    user.email;



    displayName.textContent =
    user.displayName || "MatchConnect User";



    if(user.photoURL){

        profileImage.src =
        user.photoURL;

    }



});





// Add another account

addAccountBtn.onclick = ()=>{


    // Sign out current account
    // Then login with another account

    signOut(auth)
    .then(()=>{

        window.location.href="login.html";

    });


};





// Logout current account

logoutBtn.onclick = async()=>{


    const confirmLogout =
    confirm("Log out this account?");


    if(!confirmLogout)
    return;



    await signOut(auth);


    window.location.href="login.html";


};
