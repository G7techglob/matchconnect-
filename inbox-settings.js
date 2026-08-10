import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    deleteDoc,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const params = new URLSearchParams(window.location.search);
const receiverUid = params.get("uid");
const pinChatText = document.getElementById("pinChatText");

async function updatePinButton() {

    const user = auth.currentUser;

    if (!user) return;

    const settingsSnap = await getDoc(
        doc(db, "chatSettings", user.uid + "_" + receiverUid)
    );

    if (
        settingsSnap.exists() &&
        settingsSnap.data().pinned === true
    ) {
        pinChatText.textContent = "Unpin Chat";
    } else {
        pinChatText.textContent = "Pin Chat";
    }

}

document.getElementById("backBtn").onclick = () => {
    history.back();
};

document.getElementById("viewProfile").onclick = () => {
    window.location.href = `user.html?uid=${receiverUid}`;
};

document.getElementById("muteChat").onclick = async () => {

    const user = auth.currentUser;

    if (!user) return;

    await setDoc(
        doc(db, "chatSettings", user.uid + "_" + receiverUid),
        {
            muted: true
        },
        { merge: true }
    );

    alert("Notifications muted for this chat.");
};

document.getElementById("pinChat").onclick = async () => {

    const user = auth.currentUser;

    if (!user) return;

    const settingsRef = doc(
        db,
        "chatSettings",
        user.uid + "_" + receiverUid
    );

    const settingsSnap = await getDoc(settingsRef);

    let pinned = false;

    if (settingsSnap.exists()) {
        pinned = settingsSnap.data().pinned === true;
    }

    await setDoc(
        settingsRef,
        {
            pinned: !pinned
        },
        { merge: true }
    );

    alert(!pinned ? "Chat pinned successfully." : "Chat unpinned successfully.");
};
await updatePinButton();

document.getElementById("clearChat").onclick = async () => {

    const confirmClear = confirm(
        "Are you sure you want to clear this chat?"
    );

    if (!confirmClear) return;

    const chatId = [auth.currentUser.uid, receiverUid].sort().join("_");

    const messagesRef = collection(db, "chats", chatId, "messages");

    const snapshot = await getDocs(messagesRef);

    for (const message of snapshot.docs) {
        await deleteDoc(message.ref);
    }

    alert("Chat cleared successfully.");

    history.back();
};

document.getElementById("deleteChat").onclick = async () => {

    const confirmDelete = confirm(
        "Delete this conversation? This cannot be undone."
    );

    if (!confirmDelete) return;

    const chatId = [auth.currentUser.uid, receiverUid].sort().join("_");

    // Delete all messages
    const messagesRef = collection(db, "chats", chatId, "messages");
    const snapshot = await getDocs(messagesRef);

    for (const message of snapshot.docs) {
        await deleteDoc(message.ref);
    }

    // Delete chat settings for this conversation
    await deleteDoc(
        doc(db, "chatSettings", auth.currentUser.uid + "_" + receiverUid)
    );

    alert("Conversation deleted.");

    window.location.href = "chats.html";
};

document.getElementById("blockUser").onclick = async () => {

    const confirmBlock = confirm(
        "Block this user? You won't be able to send messages to each other."
    );

    if (!confirmBlock) return;

    const user = auth.currentUser;

    if (!user) return;

    await setDoc(
        doc(db, "blockedUsers", user.uid + "_" + receiverUid),
        {
            blockerId: user.uid,
            blockedId: receiverUid,
            blockedAt: new Date()
        }
    );

    alert("User blocked successfully.");

    window.location.href = "chats.html";
};

document.getElementById("reportUser").onclick = async () => {

    const confirmReport = confirm(
        "Report this user for inappropriate behavior?"
    );

    if (!confirmReport) return;

    const user = auth.currentUser;

    if (!user) return;

    await addDoc(collection(db, "reports"), {
        reporterId: user.uid,
        reportedUserId: receiverUid,
        createdAt: new Date(),
        status: "pending"
    });

    alert("Thank you. Your report has been submitted.");
};

window.addEventListener("load", () => {
    updatePinButton();
});
