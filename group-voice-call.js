import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    getDocs,
    collection,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =====================================================
// URL PARAMETERS
// =====================================================

const params =
    new URLSearchParams(
        window.location.search
    );


const groupId =
    params.get("groupId");


const callId =
    params.get("callId");


const callType =
    params.get("type") || "voice";


// =====================================================
// HTML ELEMENTS
// =====================================================

const groupName =
    document.getElementById("groupName");


const groupPhoto =
    document.getElementById("groupPhoto");


const callStatus =
    document.getElementById("callStatus");


const participantsContainer =
    document.getElementById("participants");


const connectionMessage =
    document.getElementById(
        "connectionMessage"
    );


const muteBtn =
    document.getElementById("muteBtn");


const muteIcon =
    document.getElementById("muteIcon");


const muteText =
    document.getElementById("muteText");


const speakerBtn =
    document.getElementById("speakerBtn");


const leaveBtn =
    document.getElementById("leaveBtn");


const backBtn =
    document.getElementById("backBtn");


const audioContainer =
    document.getElementById(
        "audioContainer"
    );


// =====================================================
// CURRENT USER
// =====================================================

let currentUser = null;


// =====================================================
// GROUP DATA
// =====================================================

let groupData = null;


// =====================================================
// LOCAL MICROPHONE
// =====================================================

let localStream = null;


// =====================================================
// MUTE STATE
// =====================================================

let isMuted = false;


// =====================================================
// SPEAKER STATE
// =====================================================

let speakerEnabled = true;


// =====================================================
// PARTICIPANTS
// =====================================================

const participants = new Map();


// =====================================================
// WEBRTC CONNECTIONS
// =====================================================

const peerConnections = new Map();


// =====================================================
// REMOTE AUDIO
// =====================================================

const remoteAudios = new Map();


// =====================================================
// PROFILE CACHE
// =====================================================

const profileCache = {};


// =====================================================
// STUN SERVERS
// =====================================================

const rtcConfiguration = {

    iceServers: [

        {
            urls:
                "stun:stun.l.google.com:19302"
        },

        {
            urls:
                "stun:stun1.l.google.com:19302"
        }

    ]

};


// =====================================================
// CREATE PAIR ID
// =====================================================

function createPairId(
    uid1,
    uid2
) {

    return [
        uid1,
        uid2
    ]
        .sort()
        .join("_");

}


// =====================================================
// GET USER PROFILE
// =====================================================

async function getUserProfile(uid) {

    if (profileCache[uid]) {

        return profileCache[uid];

    }


    try {

        const userSnap =
            await getDoc(
                doc(
                    db,
                    "users",
                    uid
                )
            );


        if (userSnap.exists()) {

            const data =
                userSnap.data();


            const profile = {

                name:
                    data.name ||
                    "User",

                photoURL:
                    data.photoURL ||
                    "images/default-avatar.png"

            };


            profileCache[uid] =
                profile;


            return profile;

        }

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

    }


    return {

        name: "User",

        photoURL:
            "images/default-avatar.png"

    };

}


// =====================================================
// SHOW PARTICIPANT
// =====================================================

async function renderParticipant(
    uid,
    participantData
) {

    const profile =
        await getUserProfile(uid);


    let element =
        document.getElementById(
            `participant-${uid}`
        );


    if (!element) {

        element =
            document.createElement(
                "div"
            );


        element.id =
            `participant-${uid}`;


        element.className =
            "participant";


        participantsContainer.appendChild(
            element
        );

    }


    const muted =
        participantData?.muted === true;


    element.innerHTML = `

        <img
            src="${profile.photoURL}"
            class="participant-avatar"
            alt="${profile.name}"
        >

        <div class="participant-name">
            ${profile.name}
        </div>

        <div
            class="participant-status ${
                muted
                    ? "muted"
                    : ""
            }"
        >
            ${
                muted
                    ? "🔇 Muted"
                    : "🎤 Speaking"
            }
        </div>

    `;

}


// =====================================================
// REMOVE PARTICIPANT UI
// =====================================================

function removeParticipantUI(uid) {

    const element =
        document.getElementById(
            `participant-${uid}`
        );


    if (element) {

        element.remove();

    }

}


// =====================================================
// LOAD GROUP
// =====================================================

async function loadGroup() {

    const groupSnap =
        await getDoc(
            doc(
                db,
                "groups",
                groupId
            )
        );


    if (!groupSnap.exists()) {

        throw new Error(
            "Group does not exist."
        );

    }


    groupData =
        groupSnap.data();


    groupName.textContent =
        groupData.name ||
        "Group";


    groupPhoto.src =
        groupData.photoURL ||
        "images/default-avatar.png";


    const members =
        Array.isArray(
            groupData.members
        )
            ? groupData.members
            : [];


    if (
        !members.includes(
            currentUser.uid
        )
    ) {

        throw new Error(
            "You are not a member of this group."
        );

    }

}


// =====================================================
// GET CALL
// =====================================================

async function loadCall() {

    const callSnap =
        await getDoc(
            doc(
                db,
                "groupCalls",
                callId
            )
        );


    if (!callSnap.exists()) {

        throw new Error(
            "This call no longer exists."
        );

    }


    const callData =
        callSnap.data();


    if (
        callData.groupId !==
        groupId
    ) {

        throw new Error(
            "Invalid group call."
        );

    }


    if (
        callData.type !==
        "voice"
    ) {

        throw new Error(
            "This is not a voice call."
        );

    }


    if (
        callData.status ===
        "ended"
    ) {

        throw new Error(
            "This call has ended."
        );

    }

}


// =====================================================
// GET MICROPHONE
// =====================================================

async function getMicrophone() {

    try {

        localStream =
            await navigator.mediaDevices
                .getUserMedia({

                    audio: {

                        echoCancellation:
                            true,

                        noiseSuppression:
                            true,

                        autoGainControl:
                            true

                    },

                    video: false

                });


        return true;

    } catch (error) {

        console.error(
            "Microphone error:",
            error
        );


        alert(
            "Microphone permission is required for the voice call."
        );


        return false;

    }

}


// =====================================================
// ADD PARTICIPANT RECORD
// =====================================================

async function joinCall() {

    const participantRef =
        doc(
            db,
            "groupCalls",
            callId,
            "participants",
            currentUser.uid
        );


    await setDoc(
        participantRef,
        {

            uid:
                currentUser.uid,

            joinedAt:
                serverTimestamp(),

            muted:
                false,

            cameraOn:
                false,

            online:
                true

        },
        {
            merge: true
        }
    );

}


// =====================================================
// LISTEN FOR PARTICIPANTS
// =====================================================

function listenForParticipants() {

    const participantsRef =
        collection(
            db,
            "groupCalls",
            callId,
            "participants"
        );


    onSnapshot(
        participantsRef,
        async (snapshot) => {

            const activeUIDs =
                new Set();


            for (
                const participantDoc
                of snapshot.docs
            ) {

                const uid =
                    participantDoc.id;


                const data =
                    participantDoc.data();


                if (
                    data.online === false
                ) {

                    continue;

                }


                activeUIDs.add(uid);


                participants.set(
                    uid,
                    data
                );


                await renderParticipant(
                    uid,
                    data
                );

            }


            // Remove users who left

            for (
                const uid
                of participants.keys()
            ) {

                if (
                    !activeUIDs.has(uid)
                ) {

                    participants.delete(
                        uid
                    );


                    removeParticipantUI(
                        uid
                    );


                    closePeerConnection(
                        uid
                    );

                }

            }


            const count =
                activeUIDs.size;


            callStatus.textContent =
                `${count} participant${
                    count === 1
                        ? ""
                        : "s"
                }`;


            connectionMessage.textContent =
                count > 1
                    ? "Connected"
                    : "Waiting for others to join...";


            // Connect to other participants

            for (
                const uid
                of activeUIDs
            ) {

                if (
                    uid ===
                    currentUser.uid
                ) {

                    continue;

                }


                await ensurePeerConnection(
                    uid
                );

            }

        }
    );

}


// =====================================================
// CREATE PEER CONNECTION
// =====================================================

function createPeerConnection(
    remoteUid
) {

    const peer =
        new RTCPeerConnection(
            rtcConfiguration
        );


    peerConnections.set(
        remoteUid,
        peer
    );


    // =========================
    // ADD LOCAL AUDIO
    // =========================

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                track => {

                    peer.addTrack(
                        track,
                        localStream
                    );

                }
            );

    }


    // =========================
    // REMOTE AUDIO
    // =========================

    peer.ontrack =
        event => {

            const stream =
                event.streams[0];


            if (!stream) return;


            let audio =
                remoteAudios.get(
                    remoteUid
                );


            if (!audio) {

                audio =
                    document.createElement(
                        "audio"
                    );


                audio.autoplay =
                    true;


                audio.playsInline =
                    true;


                audio.dataset.uid =
                    remoteUid;


                audioContainer.appendChild(
                    audio
                );


                remoteAudios.set(
                    remoteUid,
                    audio
                );

            }


            audio.srcObject =
                stream;


            audio.muted =
                !speakerEnabled;


            audio.play()
                .catch(
                    error => {

                        console.warn(
                            "Audio autoplay blocked:",
                            error
                        );

                    }
                );

        };


    // =========================
    // ICE CANDIDATE
    // =========================

    peer.onicecandidate =
        async event => {

            if (
                !event.candidate
            ) {

                return;

            }


            const pairId =
                createPairId(
                    currentUser.uid,
                    remoteUid
                );


            const candidateRef =
                doc(
                    collection(
                        db,
                        "groupCalls",
                        callId,
                        "connections",
                        pairId,
                        "candidates",
                        currentUser.uid,
                        "items"
                    )
                );


            await setDoc(
                candidateRef,
                {

                    candidate:
                        event.candidate
                            .candidate,

                    sdpMid:
                        event.candidate
                            .sdpMid,

                    sdpMLineIndex:
                        event.candidate
                            .sdpMLineIndex,

                    createdAt:
                        serverTimestamp()

                }
            );

        };


    peer.onconnectionstatechange =
        () => {

            console.log(
                "Connection",
                remoteUid,
                peer.connectionState
            );


            if (
                peer.connectionState ===
                    "failed" ||
                peer.connectionState ===
                    "closed"
            ) {

                closePeerConnection(
                    remoteUid
                );

            }

        };


    return peer;

}


// =====================================================
// ENSURE PEER CONNECTION
// =====================================================

async function ensurePeerConnection(
    remoteUid
) {

    if (
        peerConnections.has(
            remoteUid
        )
    ) {

        return;

    }


    const peer =
        createPeerConnection(
            remoteUid
        );


    /*
     * IMPORTANT
     *
     * The participant with the
     * smaller UID creates the offer.
     *
     * This prevents both users
     * from creating offers at
     * the same time.
     */

    const shouldCreateOffer =
        currentUser.uid <
        remoteUid;


    if (
        shouldCreateOffer
    ) {

        try {

            await createOffer(
                remoteUid,
                peer
            );

        } catch (error) {

            console.error(
                "Create offer error:",
                error
            );

        }

    }


    listenForConnection(
        remoteUid,
        peer
    );

}


// =====================================================
// CREATE OFFER
// =====================================================

async function createOffer(
    remoteUid,
    peer
) {

    const offer =
        await peer.createOffer();


    await peer.setLocalDescription(
        offer
    );


    const pairId =
        createPairId(
            currentUser.uid,
            remoteUid
        );


    const connectionRef =
        doc(
            db,
            "groupCalls",
            callId,
            "connections",
            pairId
        );


    await setDoc(
        connectionRef,
        {

            caller:
                currentUser.uid,

            receiver:
                remoteUid,

            offer: {

                type:
                    offer.type,

                sdp:
                    offer.sdp

            },

            createdAt:
                serverTimestamp()

        },
        {
            merge: true
        }
    );

}


// =====================================================
// LISTEN FOR CONNECTION
// =====================================================

function listenForConnection(
    remoteUid,
    peer
) {

    const pairId =
        createPairId(
            currentUser.uid,
            remoteUid
        );


    const connectionRef =
        doc(
            db,
            "groupCalls",
            callId,
            "connections",
            pairId
        );


    onSnapshot(
        connectionRef,
        async snapshot => {

            if (
                !snapshot.exists()
            ) {

                return;

            }


            const data =
                snapshot.data();


            try {

                // =====================================
                // RECEIVER HANDLES OFFER
                // =====================================

                if (
                    data.offer &&
                    data.receiver ===
                        currentUser.uid &&
                    !peer.currentRemoteDescription
                ) {

                    await peer.setRemoteDescription(
                        new RTCSessionDescription(
                            data.offer
                        )
                    );


                    const answer =
                        await peer.createAnswer();


                    await peer.setLocalDescription(
                        answer
                    );


                    await updateDoc(
                        connectionRef,
                        {

                            answer: {

                                type:
                                    answer.type,

                                sdp:
                                    answer.sdp

                            }

                        }
                    );

                }


                // =====================================
                // CALLER HANDLES ANSWER
                // =====================================

                if (
                    data.answer &&
                    data.caller ===
                        currentUser.uid &&
                    !peer.currentRemoteDescription
                ) {

                    await peer.setRemoteDescription(
                        new RTCSessionDescription(
                            data.answer
                        )
                    );

                }

            } catch (error) {

                console.error(
                    "Signaling error:",
                    error
                );

            }

        }
    );


    // =====================================
    // LISTEN FOR REMOTE ICE CANDIDATES
    // =====================================

    const remoteCandidateRef =
        collection(
            db,
            "groupCalls",
            callId,
            "connections",
            pairId,
            "candidates",
            remoteUid,
            "items"
        );


    onSnapshot(
        remoteCandidateRef,
        async snapshot => {

            for (
                const candidateDoc
                of snapshot.docChanges()
            ) {

                if (
                    candidateDoc.type !==
                    "added"
                ) {

                    continue;

                }


                const data =
                    candidateDoc.doc.data();


                if (
                    !data.candidate
                ) {

                    continue;

                }


                try {

                    await peer.addIceCandidate(

                        new RTCIceCandidate({

                            candidate:
                                data.candidate,

                            sdpMid:
                                data.sdpMid,

                            sdpMLineIndex:
                                data.sdpMLineIndex

                        })

                    );

                } catch (error) {

                    console.error(
                        "Add ICE candidate error:",
                        error
                    );

                }

            }

        }
    );

}


// =====================================================
// CLOSE PEER CONNECTION
// =====================================================

function closePeerConnection(
    remoteUid
) {

    const peer =
        peerConnections.get(
            remoteUid
        );


    if (peer) {

        peer.close();

    }


    peerConnections.delete(
        remoteUid
    );


    const audio =
        remoteAudios.get(
            remoteUid
        );


    if (audio) {

        audio.srcObject =
            null;


        audio.remove();

    }


    remoteAudios.delete(
        remoteUid
    );

}


// =====================================================
// MUTE MICROPHONE
// =====================================================

async function toggleMute() {

    if (!localStream) return;


    const tracks =
        localStream.getAudioTracks();


    isMuted =
        !isMuted;


    tracks.forEach(
        track => {

            track.enabled =
                !isMuted;

        }
    );


    muteIcon.textContent =
        isMuted
            ? "🔇"
            : "🎤";


    muteText.textContent =
        isMuted
            ? "Unmute"
            : "Mute";


    await updateDoc(
        doc(
            db,
            "groupCalls",
            callId,
            "participants",
            currentUser.uid
        ),
        {

            muted:
                isMuted

        }
    );


    const participantData =
        participants.get(
            currentUser.uid
        );


    if (participantData) {

        participantData.muted =
            isMuted;


        await renderParticipant(
            currentUser.uid,
            participantData
        );

    }

}


// =====================================================
// SPEAKER
// =====================================================

function toggleSpeaker() {

    speakerEnabled =
        !speakerEnabled;


    remoteAudios.forEach(
        audio => {

            audio.muted =
                !speakerEnabled;

        }
    );


    speakerBtn.innerHTML =
        speakerEnabled
            ? "🔊 <span>Speaker</span>"
            : "🔇 <span>Speaker</span>";

}


// =====================================================
// LEAVE CALL
// =====================================================

async function leaveCall() {

    try {

        // =========================
        // MARK USER OFFLINE
        // =========================

        if (
            currentUser &&
            callId
        ) {

            await updateDoc(
                doc(
                    db,
                    "groupCalls",
                    callId,
                    "participants",
                    currentUser.uid
                ),
                {

                    online:
                        false,

                    leftAt:
                        serverTimestamp()

                }
            );

        }


        // =========================
        // CLOSE PEERS
        // =========================

        peerConnections.forEach(
            peer => {

                peer.close();

            }
        );


        peerConnections.clear();


        // =========================
        // STOP MICROPHONE
        // =========================

        if (localStream) {

            localStream
                .getTracks()
                .forEach(
                    track => {

                        track.stop();

                    }
                );

            localStream =
                null;

        }


    } catch (error) {

        console.error(
            "Leave call error:",
            error
        );

    }


    window.location.href =
        `group-chat.html?groupId=${encodeURIComponent(groupId)}`;

}


// =====================================================
// BUTTONS
// =====================================================

if (muteBtn) {

    muteBtn.addEventListener(
        "click",
        toggleMute
    );

}


if (speakerBtn) {

    speakerBtn.addEventListener(
        "click",
        toggleSpeaker
    );

}


if (leaveBtn) {

    leaveBtn.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "Leave this voice call?"
                );


            if (confirmed) {

                await leaveCall();

            }

        }
    );

}


if (backBtn) {

    backBtn.addEventListener(
        "click",
        async () => {

            await leaveCall();

        }
    );

}


// =====================================================
// HANDLE PAGE CLOSING
// =====================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (
            currentUser &&
            callId
        ) {

            updateDoc(
                doc(
                    db,
                    "groupCalls",
                    callId,
                    "participants",
                    currentUser.uid
                ),
                {

                    online:
                        false

                }
            ).catch(
                () => {}
            );

        }


        if (localStream) {

            localStream
                .getTracks()
                .forEach(
                    track => {

                        track.stop();

                    }
                );

        }

    }
);


// =====================================================
// AUTH + START
// =====================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            user;


        if (
            !groupId ||
            !callId
        ) {

            alert(
                "Invalid group call."
            );

            return;

        }


        if (
            callType !==
            "voice"
        ) {

            alert(
                "Invalid call type."
            );

            return;

        }


        try {

            connectionMessage.textContent =
                "Loading call...";


            // =========================
            // LOAD GROUP
            // =========================

            await loadGroup();


            // =========================
            // LOAD CALL
            // =========================

            await loadCall();


            // =========================
            // MICROPHONE
            // =========================

            const microphoneReady =
                await getMicrophone();


            if (!microphoneReady) {

                return;

            }


            // =========================
            // JOIN
            // =========================

            await joinCall();


            // =========================
            // LISTEN
            // =========================

            listenForParticipants();


            connectionMessage.textContent =
                "Waiting for other participants...";


        } catch (error) {

            console.error(
                "Group voice call startup error:",
                error
            );


            alert(
                error.message ||
                "Unable to join group voice call."
            );


            window.location.href =
                `group-chat.html?groupId=${encodeURIComponent(groupId)}`;

        }

    }
);
