import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import { auth, db, storage } from "./firebase.js";
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc,
    setDoc, 
    doc, 
    onSnapshot, 
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("messageInput");
const recordBtn = document.getElementById("recordBtn");

let mediaRecorder;
let audioChunks = [];
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

// Function to fetch user profile data
const getUserProfile = async (userId) => {
    try {
        const userSnap = await getDoc(doc(db, "users", userId));
        return userSnap.data() || {};
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return {};
    }
};

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

onSnapshot(q, async (snapshot) => {

    const spinner = messagesDiv.querySelector(".loading-spinner");
    if (spinner) spinner.remove();

    for (const change of snapshot.docChanges()) {

        if (change.type === "added") {

            const msg = change.doc.data();
            const docId = change.doc.id;

            if (!messageIds.has(docId)) {
                messageIds.add(docId);

                // Fetch sender's profile
                const userProfile = await getUserProfile(msg.senderId);

                const messageDiv = document.createElement("div");
                messageDiv.className = msg.senderId === auth.currentUser.uid 
                    ? "message sent" 
                    : "message received";

                // Create profile image
                const profileImg = document.createElement("img");
                profileImg.src = userProfile.photoURL || "images/default-avatar.png";
                profileImg.className = "message-avatar";
                profileImg.width = 40;
                profileImg.height = 40;
                profileImg.style.borderRadius = "50%";
                profileImg.style.cursor = "pointer";
                profileImg.style.marginRight = "10px";
                profileImg.style.objectFit = "cover";
                
                // Click profile picture to open user profile
                profileImg.addEventListener("click", () => {
                    window.location.href = `user.html?uid=${msg.senderId}`;
                });

                // Create user info
                const userDiv = document.createElement("div");
                userDiv.className = "message-user";
                userDiv.textContent = userProfile.name || msg.username || "Anonymous";

                const timeSpan = document.createElement("span");
                timeSpan.className = "message-time";
                if (msg.time) {
                    timeSpan.textContent = new Date(msg.time.toMillis()).toLocaleString();
                }
                userDiv.appendChild(timeSpan);

                // Create message text
                const contentDiv = document.createElement("div");
contentDiv.className = "message-text";

if (msg.type === "audio") {

    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = msg.audioUrl;

    contentDiv.appendChild(audio);

} else {
    contentDiv.textContent = msg.text || "";
}

                // Create wrapper for content
                const contentWrapper = document.createElement("div");
                contentWrapper.style.display = "flex";
                contentWrapper.style.alignItems = "flex-start";
                contentWrapper.style.gap = "10px";
                
                // Create text wrapper
                const textWrapper = document.createElement("div");
                textWrapper.appendChild(userDiv);
                textWrapper.appendChild(contentDiv);
                
                contentWrapper.appendChild(profileImg);
                contentWrapper.appendChild(textWrapper);
                messageDiv.appendChild(contentWrapper);
                messagesDiv.appendChild(messageDiv);

                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
        }
    }

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

callBtn.addEventListener("click", async () => {

    callId = [auth.currentUser.uid, receiverUid].sort().join("_");

    peerConnection = new RTCPeerConnection(servers);

    localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    });
    onSnapshot(doc(db, "calls", callId), async (snapshot) => {

    const data = snapshot.data();
    if (!data) return;

    if (data.offer && !peerConnection) {

        peerConnection = new RTCPeerConnection(servers);

        peerConnection.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0];
        };

        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });

        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        localVideo.srcObject = localStream;

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(JSON.parse(data.offer))
        );

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        await updateDoc(doc(db, "calls", callId), {
            answer: JSON.stringify(answer)
        });

        callScreen.classList.remove("hidden");
        callStatus.textContent = "In Call";
    }

    if (data.answer && peerConnection) {
        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(JSON.parse(data.answer))
        );
    }
});

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    localVideo.srcObject = localStream;

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    await setDoc(doc(db, "calls", callId), {
        offer: JSON.stringify(offer),
        from: auth.currentUser.uid,
        to: receiverUid
    });

    callStatus.textContent = "Calling...";
    callScreen.classList.remove("hidden");
});
async function uploadAudio(blob) {

    if (!auth.currentUser) return;

    const chatId = [auth.currentUser.uid, receiverUid]
        .sort()
        .join("_");

    const audioRef = ref(storage, `voice/${Date.now()}.webm`);

    await uploadBytes(audioRef, blob);

    const url = await getDownloadURL(audioRef);

    await addDoc(
        collection(db, "chats", chatId, "messages"),
        {
            audioUrl: url,
            type: "audio",
            senderId: auth.currentUser.uid,
            receiverId: receiverUid,
            time: serverTimestamp()
        }
    );
}

if (recordBtn) {
  recordBtn.addEventListener("click", async () => {
      });
}
const callBtn = document.getElementById("callBtn");
const callScreen = document.getElementById("callScreen");
const endCallBtn = document.getElementById("endCallBtn");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const callStatus = document.getElementById("callStatus");

let peerConnection;
let localStream;
let callId;

const servers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
    });

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        const url = URL.createObjectURL(audioBlob);
        document.getElementById("audioPreview").src = url;
        document.getElementById("audioPreview").style.display = "block";

        await uploadAudio(audioBlob);
    };

    setTimeout(() => {
        mediaRecorder.stop();
    }, 8000);

});

endCallBtn.addEventListener("click", () => {

    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }

    callScreen.classList.add("hidden");
});

// REALTIME MESSAGES

