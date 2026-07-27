import { auth } from "./firebase.js";
import { 
    sendEmailVerification,
    reload
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const resendBtn = document.getElementById("resendBtn");
const message = document.getElementById("message");


resendBtn.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (!user) {
        message.textContent = "No user found. Please register again.";
        return;
    }

    try {

        await sendEmailVerification(user);

        message.textContent = 
        "Verification email sent again. Check your Gmail inbox.";

    } catch (error) {

        message.textContent = error.message;

    }

});


window.checkVerification = async function () {

    const user = auth.currentUser;

    if (!user) {
        message.textContent = "Please login first.";
        return;
    }

    await reload(user);

    if (user.emailVerified) {

        message.textContent = "Email verified successfully!";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);

    } else {

        message.textContent = 
        "Your email is not verified yet. Please check Gmail.";

    }

};
