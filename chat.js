import { auth, db } from "./firebase.js";
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("messageInput");
const chatUserName = document.getElementById("chatUserName");

const params = new URLSearchParams(window.location.search);
const receiverUid = params.get("uid");

if (!receiverUid) {
    console.error("No receiver UID found in URL");
    messagesDiv.innerHTML = "<p>Invalid chat user</p>";
    sendBtn.disabled = true;
    input.disabled = true;
}
// Validate DOM elements
if (!messagesDiv || !sendBtn || !input || !chatUserName) {
    console.error("Required DOM elements not found");
    throw new Error("Required DOM elements not found");
}

// Display current user name
auth.onAuthStateChanged((user) => {
    if (user) {
        chatUserName.textContent = `Welcome, ${user.email}`;

// Create private chat ID

        const chatId = [user.uid, receiverUid]
    .sort()
    .join("_");

const messagesRef = collection(db, "chats", chatId, "messages");

const q = query(messagesRef, orderBy("time", "asc"));

let messageIds = new Set();

onSnapshot(q, (snapshot) => {

    const spinner = messagesDiv.querySelector(".loading-spinner");
    if (spinner) spinner.remove();

    snapshot.docChanges().forEach((change) => {

        if (change.type === "added") {

            const msg = change.doc.data();
            const docId = change.doc.id;

            if (!messageIds.has(docId)) {
                messageIds.add(docId);

                const messageDiv = document.createElement("div");
                messageDiv.className = "message";

                const userDiv = document.createElement("div");
                userDiv.className = "message-user";
                userDiv.textContent = msg.username || "Anonymous";

                const timeSpan = document.createElement("span");
                timeSpan.className = "message-time";

                if (msg.time) {
                    timeSpan.textContent =
                        new Date(msg.time.toMillis()).toLocaleString();
                }

                userDiv.appendChild(timeSpan);

                const textDiv = document.createElement("div");
                textDiv.className = "message-text";
                textDiv.textContent = msg.text || "";

                messageDiv.appendChild(userDiv);
                messageDiv.appendChild(textDiv);

                messagesDiv.appendChild(messageDiv);

                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
        }
    });

}, (error) => {
    console.error("CHAT ERROR:", error);
});

    } else {
        chatUserName.textContent = "Not logged in";
        sendBtn.disabled = true;
        input.disabled = true;
        input.placeholder = "Please log in to chat";
    }
});

// SEND MESSAGE FUNCTION
const sendMessage = async () => {
    const text = input.value.trim();

    // Validation
    if (!text) {
        console.log("MESSAGE EMPTY");
        return;
    }

    if (text.length > 1000) {
        showError("Message too long (max 1000 characters)");
        return;
    }

    if (!auth.currentUser) {
        console.error("User not authenticated");
        showError("Please log in to send messages");
        return;
    }

    if (!auth.currentUser.email) {
        console.error("User email not available");
        showError("User email not available");
        return;
    }

    console.log("MESSAGE:", text);

    // Disable button during send
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    try {
        const chatId = [auth.currentUser.uid, receiverUid]
    .sort()
    .join("_");

        const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
const userData = userSnap.data();

await addDoc(
    collection(db, "chats", chatId, "messages"),
    {
        text: text,
        senderId: auth.currentUser.uid,
        receiverId: receiverUid,
        username: userData.username || "Anonymous",
        time: serverTimestamp()
    }
);

        console.log("MESSAGE SAVED");
        input.value = "";
        input.focus();

    } catch (error) {
        console.error("SEND ERROR:", error);
        showError("Failed to send message. Please try again.");
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send";
    }
};

// Show error message
const showError = (message) => {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    messagesDiv.insertBefore(errorDiv, messagesDiv.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
};

// Send on button click
sendBtn?.addEventListener("click", sendMessage);

// Send on Enter key (not Shift+Enter) - using keydown instead of deprecated keypress
input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// REALTIME MESSAGES
