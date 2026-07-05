console.log("Settings page loaded");

import { auth, db } from "../firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const profileImage = document.getElementById("profileImage");
const displayName = document.getElementById("displayName");
const email = document.getElementById("email");

const logoutBtn = document.getElementById("logoutBtn");
const backBtn = document.getElementById("backBtn");



/* -----------------------------
   LOAD USER
-------------------------------- */

onAuthStateChanged(auth, async (user)=>{

    if(!user){

        window.location.href="login.html";
        return;

    }

    try{

        const docRef = doc(db,"users",user.uid);

        const docSnap = await getDoc(docRef);

        if(docSnap.exists()){

            const data = docSnap.data();

            displayName.textContent =
                data.username || "Unknown User";

            email.textContent =
                data.email || user.email;

            if(data.photoURL){

                profileImage.src =
                    data.photoURL;

            }

        }

    }catch(error){

        console.error(error);

    }

});


/* -----------------------------
   BACK BUTTON
-------------------------------- */

backBtn.addEventListener("click",()=>{

    history.back();

});


/* -----------------------------
   LOGOUT
-------------------------------- */

logoutBtn.addEventListener("click",async()=>{

    const confirmLogout =
        confirm("Do you want to log out?");

    if(!confirmLogout) return;

    try{

        await signOut(auth);

        window.location.href="login.html";

    }

    catch(error){

        alert(error.message);

    }

});

const chatSettings = document.getElementById("chatSettings");

if (chatSettings) {
    chatSettings.addEventListener("click", () => {
        window.location.href = "./chat-settings.html";
    });
}
