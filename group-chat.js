import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    addDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


const groupName =
    document.getElementById("groupName");

const groupPhoto =
    document.getElementById("groupPhoto");

const messages =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendBtn =
    document.getElementById("sendBtn");

const profileCache = {};

const mediaBtn =
    document.getElementById("mediaBtn");

const mediaInput =
    document.getElementById("mediaInput");

const cameraBtn =
    document.getElementById("cameraBtn");

const cameraInput =
    document.getElementById("cameraInput");

const recordBtn =
    document.getElementById("recordBtn");

const voiceCallBtn =
    document.getElementById("voiceCallBtn");

const videoCallBtn =
    document.getElementById("videoCallBtn");


// =========================
// GROUP ID
// =========================

const params =
    new URLSearchParams(
        window.location.search
    );

const groupId =
    params.get("groupId");


// =========================
// CHAT INPUT AREA
// =========================

const chatInputArea =
    document.querySelector(".chat-input-area");


// =========================
// USER PROFILE CACHE
// =========================

async function getUserProfile(uid) {

    if (profileCache[uid]) {

        return profileCache[uid];

    }


    const userSnap =
        await getDoc(
            doc(db, "users", uid)
        );


    if (userSnap.exists()) {

        const userData =
            userSnap.data();


        profileCache[uid] = {

            username:
                userData.name ||
                "User",

            photoURL:
                userData.photoURL ||
                "images/default-avatar.png"

        };


        return profileCache[uid];

    }


    return {

        username: "User",

        photoURL:
            "images/default-avatar.png"

    };

}


// =====================================================
// UPDATE CHAT INPUT VISIBILITY
// =====================================================

function updateChatInput(isMember) {

    if (!chatInputArea) return;


    if (isMember) {

        // Member can send messages
        chatInputArea.style.display = "flex";

    } else {

        // Former member can read messages
        // but cannot send anything
        chatInputArea.style.display = "none";

    }

}


// =====================================================
// CHECK GROUP MEMBERSHIP
// =====================================================

async function checkGroupMembership(uid) {

    if (!groupId) return false;


    const groupSnap =
        await getDoc(
            doc(db, "groups", groupId)
        );


    if (!groupSnap.exists()) {

        return false;

    }


    const group =
        groupSnap.data();


    const members =
        Array.isArray(group.members)
            ? group.members
            : [];


    return members.includes(uid);

}


// =====================================================
// AUTH
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            location.href =
                "login.html";

            return;

        }


        if (!groupId) {

            alert(
                "Group not found."
            );

            return;

        }


        try {

            // =========================
            // LOAD GROUP
            // =========================

            const groupRef =
                doc(
                    db,
                    "groups",
                    groupId
                );


            const groupSnap =
                await getDoc(groupRef);


            if (!groupSnap.exists()) {

                alert(
                    "Group does not exist."
                );

                return;

            }


            const group =
                groupSnap.data();


            // =========================
            // GROUP INFO
            // =========================

            groupName.textContent =
                group.name ||
                "Group";


            groupPhoto.src =
                group.photoURL ||
                "images/default-avatar.png";


            // =========================
            // MEMBERSHIP
            // =========================

            const members =
                Array.isArray(group.members)
                    ? group.members
                    : [];


            const isMember =
                members.includes(
                    user.uid
                );


            // Hide composer if user left
            updateChatInput(
                isMember
            );


            // =========================
            // LOAD MESSAGES
            // =========================

            const messagesQuery =
                query(
                    collection(
                        db,
                        "groups",
                        groupId,
                        "messages"
                    ),
                    orderBy("time")
                );


            onSnapshot(
                messagesQuery,
                (snapshot) => {

                    messages.innerHTML = "";


                    snapshot.forEach(
                        async (messageDoc) => {

                            const message =
                                messageDoc.data();


                            const profile =
                                await getUserProfile(
                                    message.senderId
                                );


                            const div =
                                document.createElement(
                                    "div"
                                );


                            if (
                                message.senderId ===
                                user.uid
                            ) {

                                div.className =
                                    "message my-message";


                                div.innerHTML = `
                                    <div class="message-content">
                                        <p>${message.text || ""}</p>
                                    </div>
                                `;

                            } else {

                                div.className =
                                    "message other-message";


                                div.innerHTML = `
                                    <img
                                        loading="lazy"
                                        src="${profile.photoURL}"
                                        class="message-avatar"
                                        onclick="openProfile('${message.senderId}')"
                                    >

                                    <div class="message-content">

                                        <strong>
                                            ${profile.username}
                                        </strong>

                                        <p>
                                            ${message.text || ""}
                                        </p>

                                    </div>
                                `;

                            }


                            messages.appendChild(
                                div
                            );


                            messages.scrollTop =
                                messages.scrollHeight;

                        }
                    );

                }
            );


        } catch (error) {

            console.error(
                "Group chat loading error:",
                error
            );

            alert(
                "Unable to load group chat."
            );

        }

    }
);


// =====================================================
// SEND MESSAGE
// =====================================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        async () => {

            const user =
                auth.currentUser;


            if (!user) return;


            // IMPORTANT:
            // Check membership again before
            // allowing a message to be sent.

            const isMember =
                await checkGroupMembership(
                    user.uid
                );


            if (!isMember) {

                alert(
                    "You have left this group. Join the group again to send messages."
                );

                updateChatInput(false);

                return;

            }


            const text =
                messageInput.value.trim();


            if (text === "") return;


            try {

                const userSnap =
                    await getDoc(
                        doc(
                            db,
                            "users",
                            user.uid
                        )
                    );


                const userData =
                    userSnap.exists()
                        ? userSnap.data()
                        : {};


                const username =
                    userData.name ||
                    "User";


                const photoURL =
                    userData.photoURL ||
                    "images/default-avatar.png";


                await addDoc(
                    collection(
                        db,
                        "groups",
                        groupId,
                        "messages"
                    ),
                    {

                        text:
                            text,

                        senderId:
                            user.uid,

                        username:
                            username,

                        photoURL:
                            photoURL,

                        time:
                            serverTimestamp()

                    }
                );


                messageInput.value = "";


            } catch (error) {

                console.error(
                    "Send group message error:",
                    error
                );


                alert(
                    "Unable to send message."
                );

            }

        }
    );

}


// =====================================================
// GROUP MENU
// =====================================================

const groupMenuBtn =
    document.getElementById(
        "groupMenuBtn"
    );


if (groupMenuBtn) {

    groupMenuBtn.addEventListener(
        "click",
        () => {

            if (!groupId) {

                alert(
                    "No group ID found"
                );

                return;

            }


            window.location.href =
                `group-settings.html?groupId=${groupId}`;

        }
    );

}


// =====================================================
// MEDIA PICKER
// =====================================================

if (mediaBtn && mediaInput) {

    mediaBtn.addEventListener(
        "click",
        () => {

            mediaInput.click();

        }
    );

}


// =====================================================
// CAMERA
// =====================================================

if (cameraBtn && cameraInput) {

    cameraBtn.addEventListener(
        "click",
        () => {

            cameraInput.click();

        }
    );

}


// =====================================================
// VOICE RECORD
// =====================================================

if (recordBtn) {

    recordBtn.addEventListener(
        "click",
        () => {

            alert(
                "Voice recorder coming next."
            );

        }
    );

}
// =====================================================
// GROUP VOICE CALL
// =====================================================

if (voiceCallBtn) {

    voiceCallBtn.addEventListener(
        "click",
        async () => {

            const user =
                auth.currentUser;


            if (!user) {

                alert(
                    "Please log in first."
                );

                return;

            }


            if (!groupId) {

                alert(
                    "Group not found."
                );

                return;

            }


            try {

                // =====================================
                // GET GROUP
                // =====================================

                const groupRef =
                    doc(
                        db,
                        "groups",
                        groupId
                    );


                const groupSnap =
                    await getDoc(
                        groupRef
                    );


                if (!groupSnap.exists()) {

                    alert(
                        "Group does not exist."
                    );

                    return;

                }


                const group =
                    groupSnap.data();


                // =====================================
                // CHECK MEMBERSHIP
                // =====================================

                const members =
                    Array.isArray(
                        group.members
                    )
                        ? group.members
                        : [];


                if (
                    !members.includes(
                        user.uid
                    )
                ) {

                    alert(
                        "You are not a member of this group."
                    );

                    return;

                }


                // =====================================
                // CHECK FOR EXISTING ACTIVE CALL
                // =====================================

                const activeCallId =
                    group.activeCallId;


                const activeCallType =
                    group.activeCallType;


                if (
                    activeCallId &&
                    activeCallType === "voice"
                ) {

                    const activeCallRef =
                        doc(
                            db,
                            "groupCalls",
                            activeCallId
                        );


                    const activeCallSnap =
                        await getDoc(
                            activeCallRef
                        );


                    if (
                        activeCallSnap.exists()
                    ) {

                        const activeCall =
                            activeCallSnap.data();


                        if (
                            activeCall.status ===
                            "active"
                        ) {

                            // =============================
                            // JOIN EXISTING CALL
                            // =============================

                            window.location.href =
                                `group-voice-call.html?groupId=${encodeURIComponent(groupId)}&callId=${encodeURIComponent(activeCallId)}&type=voice`;

                            return;

                        }

                    }

                }


                // =====================================
                // CREATE NEW CALL
                // =====================================

                const callRef =
                    doc(
                        collection(
                            db,
                            "groupCalls"
                        )
                    );


                const callId =
                    callRef.id;


                // =====================================
                // SAVE CALL
                // =====================================

                await setDoc(
                    callRef,
                    {

                        groupId:
                            groupId,

                        type:
                            "voice",

                        hostId:
                            user.uid,

                        status:
                            "active",

                        createdAt:
                            serverTimestamp()

                    }
                );


                // =====================================
                // SAVE ACTIVE CALL TO GROUP
                // =====================================

                await updateDoc(
                    groupRef,
                    {

                        activeCallId:
                            callId,

                        activeCallType:
                            "voice",

                        activeCallStatus:
                            "active"

                    }
                );


                // =====================================
                // ADD HOST
                // =====================================

                await setDoc(
                    doc(
                        db,
                        "groupCalls",
                        callId,
                        "participants",
                        user.uid
                    ),
                    {

                        uid:
                            user.uid,

                        joinedAt:
                            serverTimestamp(),

                        muted:
                            false,

                        cameraOn:
                            false,

                        online:
                            true

                    }
                );


                // =====================================
                // OPEN GROUP VOICE CALL
                // =====================================

                window.location.href =
                    `group-voice-call.html?groupId=${encodeURIComponent(groupId)}&callId=${encodeURIComponent(callId)}&type=voice`;


            } catch (error) {

                console.error(
                    "Start/join group voice call error:",
                    error
                );


                alert(
                    "Unable to start or join group voice call."
                );

            }

        }
    );

}

// =====================================================
// VIDEO CALL
// =====================================================

if (videoCallBtn) {

    videoCallBtn.addEventListener(
        "click",
        () => {

            alert(
                "Video calling coming next."
            );

        }
    );

}


// =====================================================
// OPEN PROFILE
// =====================================================

window.openProfile =
    function(uid) {

        window.location.href =
            `user.html?uid=${uid}`;

    };
