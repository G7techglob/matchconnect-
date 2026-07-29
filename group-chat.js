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

        div.className = "message";

        div.innerHTML = `
            <strong>${message.username}</strong>
            <p>${message.text}</p>
        `;

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

    await addDoc(
        collection(db, "groups", groupId, "messages"),
        {
            text: text,
            senderId: user.uid,
            username: groupName.textContent,
            time: serverTimestamp()
        }
    );

    messageInput.value = "";

});
