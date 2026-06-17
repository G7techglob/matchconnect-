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
const chatUserName = document.getElementById("chatUserName");

// Validate DOM elements
if (!messagesDiv || !sendBtn || !input || !chatUserName) {
    console.error("Required DOM elements not found");
    throw new Error("Required DOM elements not found");
}

// Display current user name
auth.onAuthStateChanged((user) => {
    if (user) {
        chatUserName.textContent = `Welcome, ${user.email}`;
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

    if (text === "") {
        console.log("MESSAGE EMPTY");
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
        await addDoc(collection(db, "messages"), {
            text: text,
            user: auth.currentUser.email,
            userId: auth.currentUser.uid,
            time: serverTimestamp()
        });

        console.log("MESSAGE SAVED");
        input.value = "";

    } catch (error) {
        console.error("SEND ERROR:", error);
        showError("Failed to send message. Please try again.");
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send";
        input.focus();
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

// Send on Enter key (not Shift+Enter)
input?.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// REALTIME MESSAGES
const q = query(collection(db, "messages"), orderBy("time", "asc"));

let messageIds = new Set(); // Track existing messages to prevent duplicates

onSnapshot(
    q,
    (snapshot) => {
        // Clear loading message on first snapshot
        if (messagesDiv.querySelector(".loading-spinner")) {
            messagesDiv.innerHTML = "";
        }

        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const msg = change.doc.data();
                const docId = change.doc.id;

                // Prevent duplicate rendering
                if (!messageIds.has(docId)) {
                    messageIds.add(docId);

                    // Create message element
                    const messageDiv = document.createElement("div");
                    messageDiv.className = "message";
                    messageDiv.dataset.docId = docId;

                    // User info
                    const userDiv = document.createElement("div");
                    userDiv.className = "message-user";
                    userDiv.textContent = msg.user || "Anonymous";

                    // Time info
                    const timeSpan = document.createElement("span");
                    timeSpan.className = "message-time";
                    if (msg.time) {
                        const date = new Date(msg.time.toMillis());
                        timeSpan.textContent = date.toLocaleTimeString();
                    } else {
                        timeSpan.textContent = "just now";
                    }
                    userDiv.appendChild(timeSpan);

                    // Message text
                    const textDiv = document.createElement("div");
                    textDiv.className = "message-text";
                    textDiv.textContent = msg.text || "";

                    messageDiv.appendChild(userDiv);
                    messageDiv.appendChild(textDiv);
                    messagesDiv.appendChild(messageDiv);

                    // Auto-scroll to latest message
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }
            }
        });
    },
    (error) => {
        console.error("SNAPSHOT ERROR:", error);
        showError("Error loading messages. Please refresh the page.");
    }
);
