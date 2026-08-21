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
  deleteDoc,
  where
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
const imageBtn = document.getElementById("mediaBtn");
const imageInput = document.getElementById("mediaInput");
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
  listenForIncomingCalls();
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

function showMessageOptions(id) {

  // Remove an existing menu first
  const oldMenu = document.querySelector(".message-reaction-menu");

  if (oldMenu) {
    oldMenu.remove();
  }

  const menu = document.createElement("div");

  menu.className = "message-reaction-menu";

  menu.innerHTML = `
    <div class="reaction-row">

      <button data-reaction="❤️">❤️</button>
      <button data-reaction="😂">😂</button>
      <button data-reaction="👍">👍</button>
      <button data-reaction="😮">😮</button>
      <button data-reaction="😢">😢</button>

    </div>

    <div class="message-option-row">

      <button class="forward-option">
        ↗ Forward
      </button>

      ${
        document.querySelector(
          `.message[data-id="${id}"]`
        )?.classList.contains("sent")
        ?
        `
        <button class="delete-option">
          🗑 Delete
        </button>
        `
        :
        ""
      }

    </div>
  `;

  document.body.appendChild(menu);


  // --------------------------------
  // POSITION MENU
  // --------------------------------

  const messageElement =
    document.querySelector(
      `.message[data-id="${id}"]`
    );

  if (messageElement) {

    const rect =
      messageElement.getBoundingClientRect();

    menu.style.position = "fixed";

    menu.style.top =
      Math.max(10, rect.top - 65) + "px";

    menu.style.left =
      Math.max(10, rect.left) + "px";

  }


  // --------------------------------
  // REACTION BUTTONS
  // --------------------------------

  menu.querySelectorAll(
    ".reaction-row button"
  ).forEach((button) => {

    button.addEventListener(
      "click",
      async () => {

        const reaction =
          button.dataset.reaction;

        try {

          await setDoc(
            doc(
              db,
              "chats",
              chatId,
              "messages",
              id,
              "reactions",
              currentUser.uid
            ),
            {
              reaction,
              userId:
                currentUser.uid
            },
            {
              merge: true
            }
          );

          menu.remove();

        } catch (error) {

          console.error(
            "❌ Reaction error:",
            error
          );

        }

      }
    );

  });


  // --------------------------------
  // DELETE
  // --------------------------------

  const deleteButton =
    menu.querySelector(
      ".delete-option"
    );

  if (deleteButton) {

    deleteButton.addEventListener(
      "click",
      async () => {

        const confirmDelete =
          confirm(
            "Delete this message?"
          );

        if (!confirmDelete) {
          return;
        }

        try {

          await deleteDoc(
            doc(
              db,
              "chats",
              chatId,
              "messages",
              id
            )
          );

          menu.remove();

        } catch (error) {

          console.error(
            "❌ Delete message error:",
            error
          );

        }

      }
    );

  }


  // --------------------------------
  // FORWARD
  // --------------------------------

  const forwardButton =
    menu.querySelector(
      ".forward-option"
    );

  if (forwardButton) {

    forwardButton.addEventListener(
      "click",
      () => {

        alert(
          "Forward feature coming soon."
        );

        menu.remove();

      }
    );

  }


  // --------------------------------
  // CLOSE WHEN CLICKING OUTSIDE
  // --------------------------------

  setTimeout(() => {

    const closeMenu = (event) => {

      if (
        !menu.contains(event.target)
      ) {

        menu.remove();

        document.removeEventListener(
          "click",
          closeMenu
        );

      }

    };

    document.addEventListener(
      "click",
      closeMenu
    );

  }, 50);

}

window.openUserProfile = function(uid){
    window.location.href = `user.html?uid=${uid}`;
};

// OPEN INBOX SETTINGS

const inboxSettingsBtn = document.getElementById("inboxSettingsBtn");

if (inboxSettingsBtn) {
    inboxSettingsBtn.addEventListener("click", () => {
        window.location.href = `inbox-settings.html?uid=${receiverUid}`;
    });
}

// =====================================================
// MATCHCONNECT — PERMANENT CALL SYSTEM
// STEP 1: WEBRTC FOUNDATION
// =====================================================

const callBtn = document.getElementById("callBtn");
const videoCallBtn = document.getElementById("videoCallBtn");

const callScreen = document.getElementById("callScreen");
const callStatus = document.getElementById("callStatus");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const cameraBtn = document.getElementById("cameraBtn");
const switchCameraBtn = document.getElementById("switchCameraBtn");

const endCallBtn = document.getElementById("endCallBtn");


// =====================================================
// WEBRTC VARIABLES
// =====================================================

let peerConnection = null;
let localStream = null;

let currentCallId = null;
let currentCallType = null;

let callerCandidateUnsubscribe = null;
let receiverCandidateUnsubscribe = null;
let callDocumentUnsubscribe = null;


// =====================================================
// WEBRTC CONFIGURATION
// =====================================================

const rtcConfiguration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};


// =====================================================
// HELPER — SHOW CALL SCREEN
// =====================================================

function showCallScreen(statusText) {

    if (!callScreen) return;

    callScreen.classList.remove("hidden");

    if (callStatus) {
        callStatus.textContent = statusText;
    }
}


// =====================================================
// HELPER — CLOSE MEDIA STREAM
// =====================================================

function stopLocalStream() {

    if (!localStream) return;

    localStream.getTracks().forEach((track) => {
        track.stop();
    });

    localStream = null;

}


// =====================================================
// HELPER — CLEAN UP WEBRTC
// =====================================================

async function cleanupCall() {

    console.log("🧹 Cleaning up MatchConnect call");


    // Stop listeners
    if (callerCandidateUnsubscribe) {
        callerCandidateUnsubscribe();
        callerCandidateUnsubscribe = null;
    }

    if (receiverCandidateUnsubscribe) {
        receiverCandidateUnsubscribe();
        receiverCandidateUnsubscribe = null;
    }

    if (callDocumentUnsubscribe) {
        callDocumentUnsubscribe();
        callDocumentUnsubscribe = null;
    }


    // Close peer connection
    if (peerConnection) {

        peerConnection.ontrack = null;
        peerConnection.onicecandidate = null;
        peerConnection.onconnectionstatechange = null;

        peerConnection.close();

        peerConnection = null;
    }


    // Stop microphone/camera
    stopLocalStream();


    // Clear videos
    if (localVideo) {
        localVideo.srcObject = null;
    }

    if (remoteVideo) {
        remoteVideo.srcObject = null;
    }


    currentCallId = null;
    currentCallType = null;


    if (callScreen) {
        callScreen.classList.add("hidden");
    }

}


// =====================================================
// CREATE WEBRTC CONNECTION
// =====================================================

function createPeerConnection(callId, isCaller) {

    console.log(
        "🌐 Creating WebRTC connection:",
        callId,
        isCaller ? "CALLER" : "RECEIVER"
    );


    peerConnection =
        new RTCPeerConnection(rtcConfiguration);


   
    // =================================================
// RECEIVE REMOTE MEDIA
// =================================================

peerConnection.ontrack = (event) => {

    console.log("📡 REMOTE TRACK RECEIVED:", event.track.kind);

    if (!remoteVideo) {
        console.error("❌ remoteVideo element not found");
        return;
    }

    // Create a remote stream if necessary
    if (!remoteVideo.srcObject) {
        remoteVideo.srcObject = new MediaStream();
    }

    // Add the incoming track
    const remoteStream = remoteVideo.srcObject;

    const alreadyAdded = remoteStream
        .getTracks()
        .some(track => track.id === event.track.id);

    if (!alreadyAdded) {
        remoteStream.addTrack(event.track);
    }

    // Video settings
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    remoteVideo.muted = false;

    if (currentCallType === "video") {
        remoteVideo.style.display = "block";
    }

    // Try to start playback
    remoteVideo.play()
        .then(() => {
            console.log("▶️ Remote video playing");
        })
        .catch((error) => {
            console.warn(
                "⚠️ Remote video play requires user interaction:",
                error
            );
        });

};

    // =================================================
    // ICE CANDIDATE
    // =================================================

    peerConnection.onicecandidate =
        async (event) => {

        if (!event.candidate) return;

        try {

            const candidateCollection =
                isCaller
                ? "callerCandidates"
                : "receiverCandidates";


            await addDoc(
                collection(
                    db,
                    "calls",
                    callId,
                    candidateCollection
                ),
                event.candidate.toJSON()
            );


            console.log(
                "🧊 ICE candidate saved:",
                candidateCollection
            );


        } catch (error) {

            console.error(
                "❌ ICE candidate error:",
                error
            );

        }

    };


    // =================================================
    // CONNECTION STATE
    // =================================================

    peerConnection.onconnectionstatechange =
        () => {

        if (!peerConnection) return;

        console.log(
            "🔗 WebRTC state:",
            peerConnection.connectionState
        );


        if (
            peerConnection.connectionState ===
            "connected"
        ) {

            if (callStatus) {
                callStatus.textContent =
                    "Connected";
            }

        }


        if (
            peerConnection.connectionState ===
            "failed"
        ) {

            console.error(
                "❌ WebRTC connection failed"
            );

        }


        if (
            peerConnection.connectionState ===
            "disconnected"
        ) {

            console.log(
                "⚠️ WebRTC disconnected"
            );

        }

    };


    // =================================================
    // ADD LOCAL MEDIA TRACKS
    // =================================================

    if (localStream) {

        localStream
            .getTracks()
            .forEach((track) => {

                peerConnection.addTrack(
                    track,
                    localStream
                );

            });

        console.log(
            "🎤📹 Local tracks added"
        );

    }


    return peerConnection;

}
// =====================================================
// LISTEN FOR REMOTE ICE CANDIDATES
// PERMANENT VERSION
// =====================================================

function listenForRemoteCandidates(callId, isCaller) {

    const candidateCollection =
        isCaller
            ? "receiverCandidates"
            : "callerCandidates";

    console.log(
        "🧊 Listening for remote ICE:",
        candidateCollection
    );


    const candidatesRef = collection(
        db,
        "calls",
        callId,
        candidateCollection
    );


    const unsubscribe = onSnapshot(
        candidatesRef,
        async (snapshot) => {

            if (!peerConnection) {
                console.warn(
                    "⚠️ PeerConnection not ready yet"
                );
                return;
            }


            for (
                const change
                of snapshot.docChanges()
            ) {

                if (
                    change.type !==
                    "added"
                ) {
                    continue;
                }


                try {

                    const candidateData =
                        change.doc.data();


                    console.log(
                        "🧊 Remote ICE candidate received"
                    );


                    // ---------------------------------
                    // WAIT UNTIL REMOTE DESCRIPTION
                    // IS READY
                    // ---------------------------------

                    if (
                        !peerConnection
                            .remoteDescription
                    ) {

                        console.log(
                            "⏳ Waiting for remote description..."
                        );


                        // Wait briefly for the
                        // remote description
                        // before adding ICE.

                        let attempts = 0;

                        while (
                            peerConnection &&
                            !peerConnection
                                .remoteDescription &&
                            attempts < 50
                        ) {

                            await new Promise(
                                resolve =>
                                    setTimeout(
                                        resolve,
                                        100
                                    )
                            );

                            attempts++;

                        }

                    }


                    if (
                        !peerConnection ||
                        !peerConnection
                            .remoteDescription
                    ) {

                        console.warn(
                            "⚠️ Remote description still unavailable"
                        );

                        continue;

                    }


                    // ---------------------------------
                    // ADD REMOTE ICE CANDIDATE
                    // ---------------------------------

                    await peerConnection
                        .addIceCandidate(
                            new RTCIceCandidate(
                                candidateData
                            )
                        );


                    console.log(
                        "✅ Remote ICE candidate added"
                    );


                } catch (error) {

                    console.error(
                        "❌ Remote ICE candidate error:",
                        error
                    );

                }

            }

        }
    );


    // ---------------------------------------------
    // SAVE UNSUBSCRIBE FUNCTION
    // ---------------------------------------------

    if (isCaller) {

        receiverCandidateUnsubscribe =
            unsubscribe;

    } else {

        callerCandidateUnsubscribe =
            unsubscribe;

    }

}

// =====================================================
// CREATE CALL DOCUMENT
// =====================================================

async function createCall(type) {

    if (!currentUser || !receiverUid) {

        alert(
            "Unable to start the call."
        );

        return null;
    }


    try {

        const callRef =
            await addDoc(
                collection(db, "calls"),
                {

                    callerId:
                        currentUser.uid,

                    receiverId:
                        receiverUid,

                    type: type,

                    status: "ringing",

                    createdAt:
                        serverTimestamp()

                }
            );


        console.log(
            "📞 Call created:",
            callRef.id
        );


        return callRef.id;


    } catch (error) {

        console.error(
            "❌ Create call error:",
            error
        );


        alert(
            "Unable to start the call."
        );


        return null;

    }

}


// =====================================================
// START CALLER WEBRTC
// =====================================================

async function startCallerWebRTC(
    callId,
    type
) {

    try {

        currentCallId = callId;
        currentCallType = type;


        createPeerConnection(
            callId,
            true
        );


        // Listen for receiver ICE
        listenForRemoteCandidates(
            callId,
            true
        );


        // Create offer
        const offer =
            await peerConnection
                .createOffer();


        await peerConnection
            .setLocalDescription(
                offer
            );


        // Save offer
        await updateDoc(
            doc(
                db,
                "calls",
                callId
            ),
            {

                offer: {
                    type:
                        offer.type,

                    sdp:
                        offer.sdp
                }

            }
        );


        console.log(
            "📤 Caller offer sent"
        );


        // Listen for answer
        callDocumentUnsubscribe =
            onSnapshot(
                doc(
                    db,
                    "calls",
                    callId
                ),
                async (snapshot) => {

                    if (
                        !snapshot.exists()
                    ) {
                        return;
                    }


                    const call =
                        snapshot.data();


                    if (
                        call.answer &&
                        peerConnection &&
                        !peerConnection
                            .currentRemoteDescription
                    ) {

                        try {

                            await peerConnection
                                .setRemoteDescription(
                                    new RTCSessionDescription(
                                        call.answer
                                    )
                                );


                            console.log(
                                "📥 Receiver answer received"
                            );


                        } catch (error) {

                            console.error(
                                "❌ Failed to set remote answer:",
                                error
                            );

                        }

                    }


                   // =============================================
// CALL STATUS CHANGES
// =============================================

if (call.status === "rejected") {

    alert("Call was rejected.");

    await cleanupCall();

    return;
}


if (call.status === "ended") {

    alert("Call ended.");

    await cleanupCall();

    return;
} 

                }
            );


    } catch (error) {

        console.error(
            "❌ Caller WebRTC error:",
            error
        );


        alert(
            "Unable to connect the call."
        );


        await cleanupCall();

    }

}


// =====================================================
// START RECEIVER WEBRTC
// =====================================================

async function startReceiverWebRTC(
    callId,
    type
) {

    try {

        currentCallId = callId;
        currentCallType = type;


        // =================================================
        // GET RECEIVER MEDIA FIRST
        // =================================================

        if (type === "video") {

            localStream =
                await navigator
                    .mediaDevices
                    .getUserMedia({
                        audio: true,
                        video: true
                    });

        } else {

            localStream =
                await navigator
                    .mediaDevices
                    .getUserMedia({
                        audio: true,
                        video: false
                    });

        }


        console.log(
            "🎤📹 Receiver media ready"
        );


        // Local video
        if (
            localVideo &&
            type === "video"
        ) {

            localVideo.srcObject =
                localStream;

            localVideo.muted = true;
            localVideo.autoplay = true;
            localVideo.playsInline = true;

            localVideo.style.display =
                "block";

        }


        // Create connection
        createPeerConnection(
            callId,
            false
        );


        // Listen for caller ICE
        listenForRemoteCandidates(
            callId,
            false
        );


        // Get call
        const callSnap =
            await getDoc(
                doc(
                    db,
                    "calls",
                    callId
                )
            );


        if (!callSnap.exists()) {

            console.error(
                "❌ Call does not exist"
            );

            return;
        }


        const callData =
            callSnap.data();
      

      // =============================================
// LISTEN FOR CALL END / REJECTION
// =============================================

callDocumentUnsubscribe = onSnapshot(
    doc(db, "calls", callId),
    async (snapshot) => {

        if (!snapshot.exists()) {
            await cleanupCall();
            return;
        }

        const call = snapshot.data();

        if (call.status === "ended") {

            alert("Call ended.");

            await cleanupCall();

        }

        if (call.status === "rejected") {

            await cleanupCall();

        }

    }
);

        if (!callData.offer) {

            console.error(
                "❌ Caller offer missing"
            );

            return;
        }


        // Set caller offer
        await peerConnection
            .setRemoteDescription(
                new RTCSessionDescription(
                    callData.offer
                )
            );


        console.log(
            "📥 Caller offer received"
        );


        // Create answer
        const answer =
            await peerConnection
                .createAnswer();


        await peerConnection
            .setLocalDescription(
                answer
            );


        // Save answer
        await updateDoc(
            doc(
                db,
                "calls",
                callId
            ),
            {

                answer: {
                    type:
                        answer.type,

                    sdp:
                        answer.sdp
                },

                status:
                    "accepted"

            }
        );


        console.log(
            "📤 Receiver answer sent"
        );


    } catch (error) {

        console.error(
            "❌ Receiver WebRTC error:",
            error
        );


        alert(
            "Unable to connect to the caller."
        );


        await cleanupCall();

    }

}


// =====================================================
// START VOICE CALL
// =====================================================

if (callBtn) {

    callBtn.addEventListener(
        "click",
        async () => {

            try {

                if (peerConnection) {

                    alert(
                        "You are already in a call."
                    );

                    return;
                }


                localStream =
                    await navigator
                        .mediaDevices
                        .getUserMedia({
                            audio: true,
                            video: false
                        });


                console.log(
                    "🎤 Microphone ready"
                );


                const callId =
                    await createCall(
                        "audio"
                    );


                if (!callId) {

                    stopLocalStream();

                    return;
                }


                showCallScreen(
                    `Calling ${chatUserName.textContent}...`
                );


                if (localVideo) {

                    localVideo.style.display =
                        "none";

                }

                if (remoteVideo) {

                    remoteVideo.style.display =
                        "none";

                }

                if (cameraBtn) {

                    cameraBtn.style.display =
                        "none";

                }

                if (switchCameraBtn) {

                    switchCameraBtn.style.display =
                        "none";

                }


                await startCallerWebRTC(
                    callId,
                    "audio"
                );


            } catch (error) {

                console.error(
                    "❌ Voice call error:",
                    error
                );


                alert(
                    "MatchConnect needs microphone permission to make voice calls."
                );


                await cleanupCall();

            }

        }
    );

}


// =====================================================
// START VIDEO CALL
// =====================================================

if (videoCallBtn) {

    videoCallBtn.addEventListener(
        "click",
        async () => {

            try {

                if (peerConnection) {

                    alert(
                        "You are already in a call."
                    );

                    return;
                }


                localStream =
                    await navigator
                        .mediaDevices
                        .getUserMedia({
                            audio: true,
                            video: true
                        });


                console.log(
                    "🎤📹 Camera and microphone ready"
                );


                const callId =
                    await createCall(
                        "video"
                    );


                if (!callId) {

                    stopLocalStream();

                    return;
                }


                currentCallType =
                    "video";


                if (localVideo) {

                    localVideo.srcObject =
                        localStream;

                    localVideo.muted = true;
                    localVideo.autoplay = true;
                    localVideo.playsInline = true;

                    localVideo.style.display =
                        "block";
                }


                if (remoteVideo) {

                    remoteVideo.style.display =
                        "block";
                }


                if (cameraBtn) {

                    cameraBtn.style.display =
                        "inline-flex";
                }


                if (switchCameraBtn) {

                    switchCameraBtn.style.display =
                        "inline-flex";
                }


                showCallScreen(
                    `Calling ${chatUserName.textContent}...`
                );


                await startCallerWebRTC(
                    callId,
                    "video"
                );


            } catch (error) {

                console.error(
                    "❌ Video call error:",
                    error
                );


                alert(
                    "MatchConnect needs camera and microphone permission for video calls."
                );


                await cleanupCall();

            }

        }
    );

}


// =====================================================
// INCOMING CALL LISTENER
// =====================================================

function listenForIncomingCalls() {

    if (!currentUser) return;


    console.log(
        "📡 Listening for incoming calls..."
    );


    const callsQuery =
        query(
            collection(db, "calls"),
            where(
                "receiverId",
                "==",
                currentUser.uid
            )
        );


    onSnapshot(
        callsQuery,
        async (snapshot) => {

            for (
                const callDoc
                of snapshot.docs
            ) {

                const call =
                    callDoc.data();


                if (
                    call.status !==
                    "ringing"
                ) {
                    continue;
                }


                if (
                    call.callerId ===
                    currentUser.uid
                ) {
                    continue;
                }


                // Prevent answering another call
                if (peerConnection) {
                    continue;
                }


                console.log(
                    "📞 Incoming call:",
                    callDoc.id
                );


                const callerSnap =
                    await getDoc(
                        doc(
                            db,
                            "users",
                            call.callerId
                        )
                    );


                let callerName =
                    "MatchConnect User";


                if (
                    callerSnap.exists()
                ) {

                    const callerData =
                        callerSnap.data();


                    callerName =
                        callerData.name ||
                        callerData.username ||
                        "MatchConnect User";

                }


                const callType =
                    call.type === "video"
                    ? "📹 Video Call"
                    : "📞 Voice Call";


                const answer =
                    confirm(
                        `${callerName} is calling you.\n\n` +
                        `${callType}\n\n` +
                        `Press OK to answer.`
                    );


                if (!answer) {

                    await updateDoc(
                        doc(
                            db,
                            "calls",
                            callDoc.id
                        ),
                        {
                            status:
                                "rejected"
                        }
                    );


                    continue;
                }


                // Accept
                await updateDoc(
                    doc(
                        db,
                        "calls",
                        callDoc.id
                    ),
                    {
                        status:
                            "accepted"
                    }
                );


                showCallScreen(
                    `${callerName} is calling...`
                );


                await startReceiverWebRTC(
                    callDoc.id,
                    call.type
                );

            }

        },
        (error) => {

            console.error(
                "❌ Incoming call listener error:",
                error
            );

        }
    );

}


// =====================================================
// END CALL
// =====================================================

if (endCallBtn) {

    endCallBtn.addEventListener(
        "click",
        async () => {

            console.log(
                "📴 Ending call"
            );


            if (currentCallId) {

                try {

                    await updateDoc(
                        doc(
                            db,
                            "calls",
                            currentCallId
                        ),
                        {
                            status:
                                "ended",

                            endedAt:
                                serverTimestamp()
                        }
                    );

                } catch (error) {

                    console.error(
                        "❌ Failed to update call:",
                        error
                    );

                }

            }


            await cleanupCall();

        }
    );

}


// =====================================================
// CLEANUP WHEN PAGE IS CLOSED
// =====================================================

window.addEventListener(
    "beforeunload",
    () => {

        stopLocalStream();

        if (peerConnection) {

            peerConnection.close();

            peerConnection = null;

        }

    }
);
