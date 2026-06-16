import { auth, db } from "./firebase.js";
import {
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const messagesDiv =
  document.getElementById(
    "messages"
  );

const sendBtn =
  document.getElementById(
    "sendBtn"
  );

const input = document.getElementById("messageInput");

console.log(
  "messagesDiv:",
  messagesDiv
);

console.log(
  "sendBtn:",
  sendBtn
);

console.log(
  "input:",
  input
);


// SEND MESSAGE
sendBtn.addEventListener("click", async () => {

    console.log("SEND BUTTON CLICKED");

    const text = input.value;

    if (text.trim() === "") {
        console.log("MESSAGE EMPTY");
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
        div.innerHTML = `<b>${msg.user}</b>: ${msg.text}`;
        messagesDiv.appendChild(div);
    });
});



