import { auth } from "./firebase.js";
import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", () => {

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {

    const user = userCredential.user;

    // Refresh the user's information
    await user.reload();

    if (!user.emailVerified) {
        alert("Please verify your email before logging in.");

        await signOut(auth);

        return;
    }

    alert("Login successful!");

    window.location.href = "index.html";
})
    .catch((error) => {
        alert(error.message);
    });

});
