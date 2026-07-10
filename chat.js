import { auth, db,storage } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { createChatId, formatTime, escapeHTML } from "./utils.js";

const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const imageBtn = document.getElementById("imageBtn");
const imageInput = document.getElementById("imageInput");
const chatUserName = document.getElementById("chatUserName");
const chatAvatar = document.getElementById("chatAvatar");
const userStatus = document.getElementById("userStatus");
const typingIndicator = document.getElementById("typingIndicator");

const params = new URLSearchParams(window.location.search);
const receiverUid = params.get("uid");

if (!receiverUid) {
    alert("No user selected.");
    window.location.href = "chats.html";
}

let currentUser = null;
let chatId = null;
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "login.html";
        return;
    }

    currentUser = user;

    await setDoc(
    doc(db, "users", currentUser.uid),
    {
        online: true,
        lastSeen: serverTimestamp()
    },
    { merge: true }
);

    chatId = createChatId(user.uid, receiverUid);

    await loadReceiver();

loadMessages();
  listenTyping();

});

async function loadReceiver() {

    const userRef = doc(db, "users", receiverUid);

    onSnapshot(userRef, (snapshot) => {

        if (!snapshot.exists()) return;

        const data = snapshot.data();

        chatUserName.textContent =
            data.name || data.username || "User";

        chatAvatar.src =
            data.photoURL || "images/default-avatar.png";

        if (data.online) {
            userStatus.textContent = "Online";
        } else {
            userStatus.textContent = "Offline";
        }

    });

}

function loadMessages() {

    const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("time")
    );

    onSnapshot(q, (snapshot) => {

        messages.innerHTML = "";

        snapshot.forEach((messageDoc) => {

    const msg = messageDoc.data();
          if (
    msg.receiverId === currentUser.uid &&
    !msg.seen
) {

    updateDoc(
        doc(db, "chats", chatId, "messages", messageDoc.id), {
            seen: true
        }
    );

          }

            const mine = msg.senderId === currentUser.uid;

            messages.innerHTML += `
                <div class="message ${mine ? "sent" : "received"}">
                    <div class="bubble">
                        ${escapeHTML(msg.text || "")}
                        <div class="time">

    ${msg.time ? formatTime(msg.time) : ""}

    ${
        mine 
        ? (msg.seen ? " ✓✓" : " ✓")
        : ""
    }

</div>
                    </div>
                </div>
            `;

        });

        messages.scrollTop = messages.scrollHeight;

    });

}

function listenTyping() {

    onSnapshot(doc(db, "typing", chatId), (snapshot) => {

        if (!snapshot.exists()) {
            typingIndicator.textContent = "";
            return;
        }

        const data = snapshot.data();

        if (data.uid !== currentUser.uid && data.typing) {
            typingIndicator.textContent = "Typing...";
        } else {
            typingIndicator.textContent = "";
        }

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
        status: "sent",
        seen: false,
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
let typingTimer;

input.addEventListener("input", async () => {
  if (!chatId || !currentUser) return;

    await setDoc(doc(db, "typing", chatId), {
        uid: currentUser.uid,
        typing: input.value.trim().length > 0
    });

    clearTimeout(typingTimer);

    typingTimer = setTimeout(async () => {

        await setDoc(doc(db, "typing", chatId), {
            uid: currentUser.uid,
            typing: false
        });

    }, 1500);

});

window.addEventListener("beforeunload", async () => {

    if (!currentUser) return;

    await setDoc(
    doc(db, "users", currentUser.uid),
    {
        online: false,
        lastSeen: serverTimestamp()
    },
    { merge: true }
);

});

