

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

alert("navbar.js is running");

document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("navbar-container");

    if (!container) {
        console.log("Navbar container not found");
        return;
    }

    try {

        const response = await fetch("navbar.html");

        if (!response.ok) {
            console.log("Navbar fetch failed:", response.status);
            return;
        }

        const html = await response.text();

        container.innerHTML = html;

        console.log("Navbar loaded successfully");


        // Wait until navbar exists
        const navProfileImage =
        document.getElementById("navProfileImage");


        onAuthStateChanged(auth, async (user)=>{

            if(user && navProfileImage){

                const userRef = doc(db,"users",user.uid);

                const snap = await getDoc(userRef);


                if(snap.exists()){

                    const data = snap.data();

                    navProfileImage.src =
                    data.photoURL || "default-avatar.png";

                }

            }

        });


    } catch(err){

        console.log("Navbar error:", err);

    }

});
