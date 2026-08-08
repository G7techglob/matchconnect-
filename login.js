import { auth, db } from "./firebase.js";

import {
signInWithEmailAndPassword,
signOut,
sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginBtn =
document.getElementById("loginBtn");

// ========================================
// LOGIN
// ========================================

loginBtn.addEventListener("click", async () => {

const email =
    document.getElementById("loginEmail").value.trim();

const password =
    document.getElementById("loginPassword").value;


if (!email || !password) {

    alert("Please enter your email and password.");

    return;
}


try {

    // ========================================
    // SIGN IN
    // ========================================

    const userCredential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


    const user =
        userCredential.user;


    // ========================================
    // REFRESH USER INFORMATION
    // ========================================

    await user.reload();


    // ========================================
    // EMAIL VERIFICATION
    // ========================================

    if (!user.emailVerified) {

        alert(
            "Please verify your email before logging in."
        );

        await signOut(auth);

        return;
    }


    // ========================================
    // DEFAULT PROFILE INFORMATION
    // ========================================

    let profileName =
        user.displayName ||
        "MatchConnect User";


    let profilePhoto =
        user.photoURL ||
        "assets/images/default-profile.png";


    // ========================================
    // GET MATCHCONNECT PROFILE FROM FIRESTORE
    // ========================================

    try {

        const profileRef =
            doc(
                db,
                "users",
                user.uid
            );


        const profileSnap =
            await getDoc(profileRef);


        if (profileSnap.exists()) {

            const profileData =
                profileSnap.data();


            // Username / name
            profileName =
                profileData.name ||
                profileData.username ||
                profileData.displayName ||
                profileName;


            // Profile picture
            profilePhoto =
                profileData.photoURL ||
                profileData.profilePhoto ||
                profileData.profileImage ||
                profileData.photo ||
                profilePhoto;

        }

    } catch (profileError) {

        console.error(
            "Error loading MatchConnect profile:",
            profileError
        );

    }


    // ========================================
    // SAVE ACCOUNT FOR ACCOUNT SWITCHING
    // ========================================

    const savedAccounts =
        JSON.parse(
            localStorage.getItem(
                "matchconnectAccounts"
            )
        ) || [];


    // Find account by Firebase UID
    const existingAccount =
        savedAccounts.find(
            account =>
                account.uid === user.uid
        );


    // Information we want to remember
    const accountData = {

        uid: user.uid,

        email: user.email,

        name: profileName,

        photo: profilePhoto

    };


    // ========================================
    // UPDATE EXISTING ACCOUNT
    // ========================================

    if (existingAccount) {

        existingAccount.email =
            accountData.email;

        existingAccount.name =
            accountData.name;

        existingAccount.photo =
            accountData.photo;

    }

    // ========================================
    // OR ADD NEW ACCOUNT
    // ========================================

    else {

        savedAccounts.push(
            accountData
        );

    }


    // ========================================
    // SAVE TO DEVICE
    // ========================================

    localStorage.setItem(
        "matchconnectAccounts",
        JSON.stringify(
            savedAccounts
        )
    );


    // ========================================
    // LOGIN SUCCESS
    // ========================================

    alert("Login successful!");


    window.location.href =
        "index.html";


} catch (error) {

    console.error(
        "Login error:",
        error
    );

    alert(
        error.message
    );

}

});

// ========================================
// FORGOT PASSWORD
// ========================================

const forgotPassword =
document.getElementById(
"forgotPassword"
);

forgotPassword.addEventListener(
"click",
async (e) => {

    e.preventDefault();


    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();


    if (!email) {

        alert(
            "Please enter your email first."
        );

        return;
    }


    try {

        await sendPasswordResetEmail(
            auth,
            email
        );


        alert(
            "Password reset link has been sent to your email. Check your inbox."
        );


    } catch (error) {

        alert(
            error.message
        );

    }

}

);

// ========================================
// TOGGLE PASSWORD VISIBILITY
// ========================================

const togglePassword =
document.getElementById(
"togglePassword"
);

const loginPassword =
document.getElementById(
"loginPassword"
);

togglePassword.addEventListener(
"click",
() => {

    if (
        loginPassword.type ===
        "password"
    ) {

        loginPassword.type =
            "text";

        togglePassword.textContent =
            "visibility_off";

    } else {

        loginPassword.type =
            "password";

        togglePassword.textContent =
            "visibility";

    }

}

);
