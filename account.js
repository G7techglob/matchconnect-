import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Back button
document.getElementById("backBtn").onclick = () => {
    history.back();
};

// Check login
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Firebase Authentication
    document.getElementById("email").textContent = user.email;
    document.getElementById("emailInput").value = user.email;

    // Firestore profile
    try {

        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {

            const data = snap.data();

            document.getElementById("displayName").textContent =
                data.name || "No Name";

            document.getElementById("name").value =
                data.name || "";

            document.getElementById("bio").value =
                data.bio || "";

            if (data.photoURL) {
                document.getElementById("profilePhoto").src =
                    data.photoURL;
            }

            // Account creation date
            if (data.createdAt) {

                let date;

                if (data.createdAt.toDate) {
                    date = data.createdAt.toDate();
                } else {
                    date = new Date(data.createdAt);
                }

                document.getElementById("createdAt").value =
                    date.toLocaleDateString();
            }

        } else {

            document.getElementById("displayName").textContent =
                user.displayName || "User";

            document.getElementById("name").value =
                user.displayName || "";

            document.getElementById("createdAt").value =
                "Not available";
        }

    } catch (error) {

        console.error(error);

        alert("Failed to load account information.");
    }

});
