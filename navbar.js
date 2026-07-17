
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
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

        console.log("Navbar loaded successfully");

        container.innerHTML = html;

    } catch (err) {
        console.log("Navbar error:", err);
    }

});

const navProfileImage = document.getElementById("navProfileImage");

onAuthStateChanged(auth, async (user)=>{

  if(user){

    const userRef = doc(db,"users",user.uid);

    const snap = await getDoc(userRef);

    if(snap.exists()){

      const data = snap.data();

      navProfileImage.src =
        data.photoURL || "default-avatar.png";

    }

  }

});
