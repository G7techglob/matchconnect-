import { auth } from "./firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// ========================================
// ELEMENTS
// ========================================

const backBtn =
document.getElementById("backBtn");

const profileImage =
document.getElementById("profileImage");

const displayName =
document.getElementById("displayName");

const email =
document.getElementById("email");

const savedAccountsList =
document.getElementById("savedAccountsList");

const addAccountBtn =
document.getElementById("addAccountBtn");

const logoutBtn =
document.getElementById("logoutBtn");

// ========================================
// BACK BUTTON
// ========================================

backBtn.onclick = () => {

history.back();

};

// ========================================
// LOAD SAVED ACCOUNTS
// ========================================

function loadSavedAccounts() {

const savedAccounts =
    JSON.parse(
        localStorage.getItem("matchconnectAccounts")
    ) || [];


savedAccountsList.innerHTML = "";


if (savedAccounts.length === 0) {

    savedAccountsList.innerHTML = `
        <p>No saved accounts yet.</p>
    `;

    return;
}


savedAccounts.forEach((account) => {

    const accountBox =
        document.createElement("div");

    accountBox.className =
        "account-box saved-account";


    const image =
        account.photo ||
        "assets/images/default-profile.png";


    accountBox.innerHTML = `

        <img
            src="${image}"
            alt="Profile"
        >

        <div>

            <h4>
                ${account.name || "MatchConnect User"}
            </h4>

            <p>
                ${account.email}
            </p>

        </div>

    `;


    savedAccountsList.appendChild(accountBox);

});

}

// ========================================
// LOAD CURRENT ACCOUNT
// ========================================

onAuthStateChanged(auth, (user) => {

if (!user) {

    window.location.href =
        "login.html";

    return;
}


email.textContent =
    user.email || "";


displayName.textContent =
    user.displayName ||
    "MatchConnect User";


if (user.photoURL) {

    profileImage.src =
        user.photoURL;

}


// Load saved accounts
loadSavedAccounts();

});

// ========================================
// ADD ANOTHER ACCOUNT
// ========================================

addAccountBtn.onclick = async () => {

await signOut(auth);

window.location.href =
    "login.html";

};

// ========================================
// LOG OUT CURRENT ACCOUNT
// ========================================

logoutBtn.onclick = async () => {

const confirmLogout =
    confirm("Log out this account?");


if (!confirmLogout) {
    return;
}


await signOut(auth);

window.location.href =
    "login.html";

};
