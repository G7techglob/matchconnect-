import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const groupName = document.getElementById("groupName");
const groupPhoto = document.getElementById("groupPhoto");
const messages = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const profileCache = {};
const mediaBtn = document.getElementById("mediaBtn");
const mediaInput = document.getElementById("mediaInput");

const cameraBtn = document.getElementById("cameraBtn");
const cameraInput = document.getElementById("cameraInput");

const recordBtn = document.getElementById("recordBtn");

const voiceCallBtn = document.getElementById("voiceCallBtn");
const videoCallBtn = document.getElementById("videoCallBtn");

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

    const messagesQuery = query(
    collection(db, "groups", groupId, "messages"),
    orderBy("time")
);

onSnapshot(messagesQuery, (snapshot) => {

    messages.innerHTML = "";

    snapshot.forEach((messageDoc) => {

    const message = messageDoc.data();

    const div = document.createElement("div");


    if(message.senderId === auth.currentUser.uid){

        div.className = "message my-message";

        div.innerHTML = `
            <div class="message-content">
                <p>${message.text}</p>
            </div>
        `;


    } else {

        div.className = "message other-message";

        div.innerHTML = `
            <img 
    loading="lazy"
    src="${message.photoURL || 'images/default-avatar.png'}"
    class="message-avatar"
                onclick="openProfile('${message.senderId}')">

            <div class="message-content">
                <strong>${message.username}</strong>
                <p>${message.text}</p>
            </div>
        `;

    }


    messages.appendChild(div);

});
    messages.scrollTop = messages.scrollHeight;

});

});

sendBtn.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (!user) return;

    const text = messageInput.value.trim();

    if (text === "") return;

    const userSnap = await getDoc(
    doc(db, "users", user.uid)
);

const userData = userSnap.data();

const username = userData.name || "User";

const photoURL = userData.photoURL || "images/default-avatar.png";

await addDoc(
collection(db, "groups", groupId, "messages"),
{
    text: text,
    senderId: user.uid,
    username: username,
    photoURL: photoURL,
    time: serverTimestamp()
}
);

    messageInput.value = "";

});

// =========================
// GROUP MENU BUTTON
// =========================

const groupMenuBtn = document.getElementById("groupMenuBtn");

console.log("Group menu button:", groupMenuBtn);
console.log("Current group ID:", groupId);


if(groupMenuBtn){

    groupMenuBtn.addEventListener("click", ()=>{

        console.log("Group menu clicked");

        if(!groupId){

            alert("No group ID found");

            return;

        }


        window.location.href =
        `group-settings.html?groupId=${groupId}`;

    });

}

// =========================
// MEDIA PICKER
// =========================

mediaBtn.addEventListener("click", () => {
    mediaInput.click();
});

// =========================
// CAMERA
// =========================

cameraBtn.addEventListener("click", () => {
    cameraInput.click();
});

// =========================
// VOICE RECORD
// =========================

recordBtn.addEventListener("click", () => {
    alert("Voice recorder coming next.");
});

// =========================
// VOICE CALL
// =========================

voiceCallBtn.addEventListener("click", () => {
    alert("Voice calling coming next.");
});

// =========================
// VIDEO CALL
// =========================

videoCallBtn.addEventListener("click", () => {
    alert("Video calling coming next.");
});

window.openProfile = function(uid){

    window.location.href =
    `user.html?uid=${uid}`;

};
