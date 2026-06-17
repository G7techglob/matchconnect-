import { auth, db } from "./firebase.js";
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("messageInput");

if (!messagesDiv || !sendBtn || !input) {
    console.error("Required DOM elements not found");
}

// SEND MESSAGE
sendBtn?.addEventListener("click", async () => {
    console.log("SEND BUTTON CLICKED");

    const text = input.value;

    if (text.trim() === "") {
        console.log("MESSAGE EMPTY");
        return;
    }

    if (!auth.currentUser) {
        console.error("User not authenticated");
        return;
    }

    console.log("MESSAGE:", text);

    try {
        await addDoc(collection(db, "messages"), {
            text: text,
            user: auth.currentUser.email,
            time: serverTimestamp()
        });

        console.log("MESSAGE SAVED");
        input.value = "";

    } catch (error) {
        console.error("SEND ERROR:", error);
    }
});

// REALTIME MESSAGES
const q = query(collection(db, "messages"), orderBy("time"));

onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";

    snapshot.forEach((doc) => {
        const msg = doc.data();

        const div = document.createElement("div");
        const userSpan = document.createElement("b");
        userSpan.textContent = msg.user;
        div.appendChild(userSpan);
        div.appendChild(document.createTextNode(": " + msg.text));
        messagesDiv.appendChild(div);
    });
});
