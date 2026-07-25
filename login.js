import { auth } from "./firebase.js";
import {
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
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

const forgotPassword = document.getElementById("forgotPassword");


forgotPassword.addEventListener("click", async (e) => {

    e.preventDefault();


    const email = document.getElementById("loginEmail").value.trim();


    if (!email) {

        alert("Please enter your email first.");

        return;

    }


    try {

        await sendPasswordResetEmail(auth, email);


        alert("Password reset link has been sent to your email. Check your inbox.");


    } catch (error) {

        alert(error.message);

    }

});

const togglePassword = document.getElementById("togglePassword");

const loginPassword = document.getElementById("loginPassword");


togglePassword.addEventListener("click", () => {

    if (loginPassword.type === "password") {

        loginPassword.type = "text";

        togglePassword.textContent = "visibility_off";

    } else {

        loginPassword.type = "password";

        togglePassword.textContent = "visibility";

    }

});
