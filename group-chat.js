import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const groupName = document.getElementById("groupName");
const groupPhoto = document.getElementById("groupPhoto");

const params = new URLSearchParams(window.location.search);
const groupId = params.get("groupId");

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "login.html";
        return;
    }

    if (!groupId) {
        alert("Group not found.");
        return;
    }

    const groupRef = doc(db, "groups", groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
        alert("Group does not exist.");
        return;
    }

    const group = groupSnap.data();

    groupName.textContent = group.name;

    groupPhoto.src =
        group.photoURL || "images/default-avatar.png";

});
