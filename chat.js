import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { createChatId, formatTime, escapeHTML } from "./utils.js";

const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatUserName = document.getElementById("chatUserName");

const params = new URLSearchParams(window.location.search);
const receiverUid = params.get("uid");

let currentUser = null;
let chatId = null;

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "login.html";
        return;
    }

    currentUser = user;

    await updateDoc(doc(db, "users", currentUser.uid), {
        online: true,
        lastSeen: serverTimestamp()
    });

    chatId = createChatId(user.uid, receiverUid);

    loadMessages();

});


function loadMessages() {

    const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("time")
    );

    onSnapshot(q, (snapshot) => {

        messages.innerHTML = "";

        snapshot.forEach((doc) => {

            const msg = doc.data();

            const mine = msg.senderId === currentUser.uid;

            messages.innerHTML += `
                <div class="message ${mine ? "sent" : "received"}">
                    <div class="bubble">
                        ${escapeHTML(msg.text || "")}
                        <div class="time">
                            ${msg.time ? formatTime(msg.time) : ""}
                        </div>
                    </div>
                </div>
            `;

        });

        messages.scrollTop = messages.scrollHeight;

    });

}

async function sendMessage() {

    const text = input.value.trim();

    if (!text) return;

    await addDoc(
        collection(db, "chats", chatId, "messages"),
        {
            text,
            senderId: currentUser.uid,
            receiverId: receiverUid,
            type: "text",
            time: serverTimestamp()
        }
    );

    input.value = "";
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        e.preventDefault();

        sendMessage();

    }

});

window.addEventListener("beforeunload", async () => {

    if (!currentUser) return;

    await updateDoc(doc(db, "users", currentUser.uid), {
        online: false,
        lastSeen: serverTimestamp()
    });

});

