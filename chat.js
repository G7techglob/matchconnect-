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
  updateDoc,
  setDoc,
  deleteDoc
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
let typingTimer;
let currentUserData = null;


onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  currentUser = user;
  const profileSnap = await getDoc(doc(db, "users", user.uid));

if(profileSnap.exists()){
  currentUserData = profileSnap.data();
}

  await setDoc(
    doc(db, "users", currentUser.uid),
    {
      online: true,
      lastSeen: serverTimestamp(),
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

    chatUserName.textContent = data.name || data.username || "User";
    chatAvatar.src = data.photoURL || "images/default-avatar.png";
    userStatus.textContent = data.online ? "Online" : "Offline";
    document.getElementById("chatProfile").onclick = () => {
  window.location.href = `user.html?uid=${receiverUid}`;
};
  });
}
function loadMessages(){

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("time")
  );

  onSnapshot(q, (snapshot) => {

    messages.innerHTML = "";

    const docs = snapshot.docs;

    for(let i = 0; i < docs.length; i++){

      const messageDoc = docs[i];
      const msg = messageDoc.data();


      if(msg.receiverId === currentUser.uid && !msg.seen){

        updateDoc(
          doc(db,"chats",chatId,"messages",messageDoc.id),
          {
            seen:true
          }
        );

      }


      const mine = msg.senderId === currentUser.uid;


      const nextMsg =
        i < docs.length - 1
        ? docs[i + 1].data()
        : null;


      const showAvatar =
        !mine &&
        (
          !nextMsg ||
          nextMsg.senderId !== msg.senderId
        );


      messages.innerHTML += `

<div class="message ${mine ? "sent" : "received"}" data-id="${messageDoc.id}">


${
showAvatar
?
`
<img
class="message-avatar"
src="${msg.photoURL || "images/default-avatar.png"}"
onclick="openUserProfile('${msg.senderId}')">
`
:
""
}


<div class="bubble">

${
msg.type === "image"
?
`<img src="${msg.imageURL}" class="chat-image">`
:
escapeHTML(msg.text || "")
}


<div class="message-buttons">

<button class="reply-msg" data-id="${messageDoc.id}">
↩ Reply
</button>


${
mine
?
`
<button class="delete-msg" data-id="${messageDoc.id}">
🗑 Delete
</button>
`
:
""
}


<button class="react-btn" data-id="${messageDoc.id}" data-reaction="❤️">❤️</button>

<button class="react-btn" data-id="${messageDoc.id}" data-reaction="😂">😂</button>

<button class="react-btn" data-id="${messageDoc.id}" data-reaction="👍">👍</button>


</div>


<div class="time">

${msg.time ? formatTime(msg.time) : ""}

${mine ? (msg.seen ? " ✓✓" : " ✓") : ""}

</div>


</div>

</div>

`;

    }


    document.querySelectorAll(".message").forEach((msg)=>{

      let pressTimer;


      const startPress = ()=>{

        const id = msg.dataset.id;

        pressTimer = setTimeout(()=>{

          showMessageOptions(id);

        },700);

      };


      const cancelPress = ()=>{

        clearTimeout(pressTimer);

      };


      msg.addEventListener("mousedown",startPress);
      msg.addEventListener("mouseup",cancelPress);
      msg.addEventListener("mouseleave",cancelPress);


      msg.addEventListener("touchstart",startPress);
      msg.addEventListener("touchend",cancelPress);
      msg.addEventListener("touchmove",cancelPress);


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

async function checkBlocked(){

  const currentBlock = await getDoc(
    doc(db, "blockedUsers", currentUser.uid + "_" + receiverUid)
  );

  const reverseBlock = await getDoc(
    doc(db, "blockedUsers", receiverUid + "_" + currentUser.uid)
  );


  if(currentBlock.exists() || reverseBlock.exists()){

    alert("You cannot message this user because one of you has blocked the other.");

    return true;

  }


  return false;

}

async function sendMessage() {
  if(await checkBlocked()) return;
  const text = input.value.trim();
  if (!text) return;

  await addDoc(collection(db, "chats", chatId, "messages"), {
  text,
  senderId: currentUser.uid,
  receiverId: receiverUid,

  username: currentUserData?.name || currentUserData?.username || "User",
  photoURL: currentUserData?.photoURL || "images/default-avatar.png",

  type: "text",
  status: "sent",
  seen: false,
  time: serverTimestamp(),
});

  input.value = "";

  await setDoc(
    doc(db, "typing", chatId),
    {
      uid: currentUser.uid,
      typing: false,
    },
    { merge: true }
  );
}

sendBtn.addEventListener("click", sendMessage);

imageBtn.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", async () => {

  if(await checkBlocked()) {
    imageInput.value = "";
    return;
  }


  const file = imageInput.files[0];

  if (!file) return;

  const imageRef = ref(storage, `chatImages/${chatId}/${Date.now()}_${file.name}`);
  await uploadBytes(imageRef, file);
  const imageURL = await getDownloadURL(imageRef);

  await addDoc(collection(db, "chats", chatId, "messages"), {
  imageURL,
  senderId: currentUser.uid,
  receiverId: receiverUid,

  username: currentUserData?.name || currentUserData?.username || "User",
  photoURL: currentUserData?.photoURL || "images/default-avatar.png",

  type: "image",
  status: "sent",
  seen: false,
  time: serverTimestamp(),
});

  imageInput.value = "";
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

input.addEventListener("input", async () => {
  if (!chatId || !currentUser) return;

  await setDoc(
    doc(db, "typing", chatId),
    {
      uid: currentUser.uid,
      typing: input.value.trim().length > 0,
    },
    { merge: true }
  );

  clearTimeout(typingTimer);

  typingTimer = setTimeout(async () => {
    await setDoc(
      doc(db, "typing", chatId),
      {
        uid: currentUser.uid,
        typing: false,
      },
      { merge: true }
    );
  }, 1500);
});

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-msg")) return;

  const id = e.target.dataset.id;
  const confirmDelete = confirm("Delete this message?");
  if (!confirmDelete) return;

  await deleteDoc(doc(db, "chats", chatId, "messages", id));
});

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("reply-msg")) return;

  const id = e.target.dataset.id;
  const messageSnap = await getDoc(doc(db, "chats", chatId, "messages", id));

  if (messageSnap.exists()) {
    const data = messageSnap.data();
    input.value = "Reply: " + (data.text || "");
    input.focus();
  }
});

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("react-btn")) return;

  const id = e.target.dataset.id;
  const reaction = e.target.dataset.reaction;

  await setDoc(
    doc(db, "chats", chatId, "messages", id, "reactions", currentUser.uid),
    {
      reaction,
      userId: currentUser.uid,
    },
    { merge: true }
  );
});

window.addEventListener("beforeunload", async () => {
  if (!currentUser) return;

  await setDoc(
    doc(db, "typing", chatId),
    {
      uid: currentUser.uid,
      typing: false,
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "users", currentUser.uid),
    {
      online: false,
      lastSeen: serverTimestamp(),
    },
    { merge: true }
  );
});

function showMessageOptions(id){


    const option = prompt(
    "Message options:\n\n1. Like ❤️\n2. Forward ↗\n3. Delete 🗑"
    );


    if(option === "1"){

        alert("Message liked ❤️");

    }


    if(option === "2"){

        alert("Forward feature coming soon");

    }


    if(option === "3"){


        const confirmDelete =
        confirm("Delete this message?");


        if(confirmDelete){

            deleteDoc(
            doc(db,"chats",chatId,"messages",id)
            );

        }

    }

}

window.openUserProfile = function(uid){
    window.location.href = `user.html?uid=${uid}`;
};
