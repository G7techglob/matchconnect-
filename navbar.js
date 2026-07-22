import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

async function loadNavbar() {

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

        container.innerHTML = await response.text();

        console.log("Navbar loaded successfully");

        // Load the user's profile picture
        onAuthStateChanged(auth, async (user) => {

            if (!user) return;

            const profileImg = document.getElementById("navProfileImage");

            if (!profileImg) return;

            const userSnap = await getDoc(doc(db, "users", user.uid));

            if (userSnap.exists()) {

                const data = userSnap.data();

                profileImg.src =
    data.photoURL && data.photoURL.trim() !== ""
        ? data.photoURL
        : "images/default-avatar.png";
            }

        });

    } catch (err) {

        console.log("Navbar error:", err);

    }

});

loadNavbar();
