console.log("Settings page loaded");

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc,
    deleteDoc
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

const privacySettings = document.querySelector(".settings-group:nth-of-type(2) .setting-item");

if (privacySettings) {
    privacySettings.addEventListener("click", () => {
        window.location.href = "./privacy-settings.html";
    });
}
const communityGuidelines = document.getElementById("communityGuidelines");

if (communityGuidelines) {
    communityGuidelines.addEventListener("click", () => {
        window.location.href = "./community.html";
    });
}

const privacyPolicy = document.getElementById("privacyPolicy");

if (privacyPolicy) {
    privacyPolicy.addEventListener("click", () => {
        window.location.href = "./privacy.html";
    });
}

const termsOfService = document.getElementById("termsOfService");

if (termsOfService) {
    termsOfService.addEventListener("click", () => {
        window.location.href = "./terms.html";
    });
}

const deleteAccount = document.getElementById("deleteAccount");

if (deleteAccount) {

    deleteAccount.addEventListener("click", async () => {

        const confirmDelete = confirm(
            "Are you sure you want to permanently delete your account?"
        );

        if (!confirmDelete) return;

        const user = auth.currentUser;

        if (!user) {
            alert("No user is logged in.");
            return;
        }

        try {

    await deleteDoc(doc(db, "users", user.uid));

    alert("Your profile data has been deleted.");

    window.location.href = "register.html";

} catch (error) {

    console.error(error);

    alert(
        "Unable to delete account. Please log out and log in again, then try again."
    );

        }

    });

}

const contactSupport = document.getElementById("contactSupport");

if (contactSupport) {
    contactSupport.addEventListener("click", () => {
        window.location.href = "./contact.html";
    });
}

document.getElementById("accountInfo").onclick = () => {
    window.location.href = "account.html";
};
const changePassword = document.getElementById("changePassword");

if (changePassword) {

    changePassword.addEventListener("click", () => {

        window.location.href = "./change-password.html";

    });

}

const blockedUsers = document.querySelectorAll(".settings-group")[1].querySelectorAll(".setting-item")[1];

if (blockedUsers) {

    blockedUsers.addEventListener("click", () => {

        window.location.href = "./blocked-users.html";

    });

}

const notificationSettings = document.querySelectorAll(".settings-group")[3].querySelector(".setting-item");

if (notificationSettings) {

    notificationSettings.addEventListener("click", () => {

        window.location.href = "./notification-settings.html";

    });

}

// -----------------------------
// DARK MODE
// -----------------------------

const darkModeToggle =
document.getElementById("darkModeToggle");


// Load saved mode

if(localStorage.getItem("darkMode") === "enabled"){

    document.body.classList.add("dark-mode");

    if(darkModeToggle){
        darkModeToggle.checked = true;
    }

}



// Toggle dark mode

if(darkModeToggle){

    darkModeToggle.addEventListener("change",()=>{


        if(darkModeToggle.checked){


            document.body.classList.add("dark-mode");


            localStorage.setItem(
                "darkMode",
                "enabled"
            );


        }else{


            document.body.classList.remove("dark-mode");


            localStorage.setItem(
                "darkMode",
                "disabled"
            );


        }


    });

}

const switchAccount = document.getElementById("switchAccount");

if(switchAccount){

    switchAccount.addEventListener("click",()=>{

        window.location.href="./switch-account.html";

    });

}

document.getElementById("accountInfo")?.addEventListener("click", () => {
    window.location.href = "profile.html";
});

const userCard = document.getElementById("userCard");

if (userCard) {
    userCard.addEventListener("click", () => {
        window.location.href = "profile.html";
    });
}
