import { auth, db } from "./firebase.js";

import {
    collection,
    doc,
    getDoc,
    addDoc,
    setDoc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =====================================================
// MATCHCONNECT
// ONE-TO-ONE VOICE CALL
// STABLE WEBRTC + FIRESTORE SIGNALING
// =====================================================


// =====================================================
// ELEMENTS
// =====================================================

const callerPhoto =
    document.getElementById("callerPhoto");

const callerName =
    document.getElementById("callerName");

const callStatus =
    document.getElementById("callStatus");

const voiceAvatarPhoto =
    document.getElementById("voiceAvatarPhoto");

const voiceAvatarName =
    document.getElementById("voiceAvatarName");

const muteBtn =
    document.getElementById("muteBtn");

const endCallBtn =
    document.getElementById("endCallBtn");

const backBtn =
    document.getElementById("backBtn");

const remoteAudio =
    document.getElementById("remoteAudio");


// =====================================================
// URL PARAMETERS
// =====================================================

const params =
    new URLSearchParams(
        window.location.search
    );

const receiverId =
    params.get("receiverId");

const incomingCallId =
    params.get("callId");


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;

let callId =
    incomingCallId || null;

let peerConnection = null;

let localStream = null;

let remoteStream = null;

let isCaller = false;

let callEnded = false;

let remoteDescriptionReady = false;

let pendingCandidates = [];

let addedRemoteCandidateIds =
    new Set();

let unsubscribeCall = null;

let unsubscribeAnswer = null;

let unsubscribeOffer = null;

let unsubscribeRemoteCandidates = null;


// =====================================================
// WEBRTC CONFIGURATION
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
// STATUS
// =====================================================

function setCallStatus(status) {

    if (callStatus) {

        callStatus.textContent =
            status;

    }

}


// =====================================================
// LOAD USER
// =====================================================

async function loadUser(uid) {

    if (!uid) {

        return {

            name: "User",

            photoURL:
                "images/default-avatar.png"

        };

    }


    try {

        const snap =
            await getDoc(
                doc(
                    db,
                    "users",
                    uid
                )
            );


        if (!snap.exists()) {

            return {

                name: "User",

                photoURL:
                    "images/default-avatar.png"

            };

        }


        const data =
            snap.data();


        return {

            name:
                data.name ||
                data.username ||
                "User",

            photoURL:
                data.photoURL ||
                "images/default-avatar.png"

        };


    } catch (error) {

        console.error(
            "❌ LOAD USER ERROR:",
            error
        );


        return {

            name: "User",

            photoURL:
                "images/default-avatar.png"

        };

    }

}


// =====================================================
// DISPLAY REMOTE USER
// =====================================================

async function loadRemoteUser(uid) {

    const user =
        await loadUser(uid);


    if (callerName) {

        callerName.textContent =
            user.name;

    }


    if (callerPhoto) {

        callerPhoto.src =
            user.photoURL;

    }


    if (voiceAvatarName) {

        voiceAvatarName.textContent =
            user.name;

    }


    if (voiceAvatarPhoto) {

        voiceAvatarPhoto.src =
            user.photoURL;

    }

}


// =====================================================
// MICROPHONE
// =====================================================

async function getMicrophone() {

    if (localStream) {

        return localStream;

    }


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        throw new Error(
            "Microphone is not supported by this browser."
        );

    }


    try {

        localStream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    audio: {

                        echoCancellation: true,

                        noiseSuppression: true,

                        autoGainControl: true

                    },

                    video: false

                });


        console.log(
            "🎤 MICROPHONE READY"
        );


        return localStream;


    } catch (error) {

        console.error(
            "❌ MICROPHONE ERROR:",
            error
        );


        setCallStatus(
            "Microphone permission denied"
        );


        throw error;

    }

}


// =====================================================
// CREATE PEER CONNECTION
// =====================================================

function createPeerConnection() {

    if (peerConnection) {

        return peerConnection;

    }


    console.log(
        "🔗 CREATING PEER CONNECTION"
    );


    peerConnection =
        new RTCPeerConnection(
            rtcConfiguration
        );


    remoteStream =
        new MediaStream();


    // =================================================
    // REMOTE AUDIO
    // =================================================

    if (remoteAudio) {

        remoteAudio.autoplay =
            true;

        remoteAudio.playsInline =
            true;

        remoteAudio.muted =
            false;

        remoteAudio.srcObject =
            remoteStream;

    }


    // =================================================
    // REMOTE TRACK
    // =================================================

    peerConnection.ontrack =
        async event => {

            console.log(
                "🔊 REMOTE TRACK RECEIVED"
            );


            if (!event.track) {

                return;

            }


            const exists =
                remoteStream
                    .getTracks()
                    .some(
                        track =>
                            track.id ===
                            event.track.id
                    );


            if (!exists) {

                remoteStream.addTrack(
                    event.track
                );

            }


            if (remoteAudio) {

                remoteAudio.srcObject =
                    remoteStream;


                try {

                    await remoteAudio.play();


                } catch (error) {

                    console.warn(
                        "⚠️ REMOTE AUDIO PLAY:",
                        error
                    );

                }

            }

        };


    // =================================================
    // LOCAL ICE CANDIDATES
    // =================================================

    peerConnection.onicecandidate =
        async event => {

            if (
                !event.candidate ||
                !callId ||
                callEnded
            ) {

                return;

            }


            const collectionName =
                isCaller
                    ? "callerCandidates"
                    : "receiverCandidates";


            try {

                await addDoc(

                    collection(
                        db,
                        "calls",
                        callId,
                        collectionName
                    ),

                    event.candidate.toJSON()

                );


                console.log(
                    "🧊 ICE SENT:",
                    collectionName
                );


            } catch (error) {

                console.error(
                    "❌ ICE SEND ERROR:",
                    error
                );

            }

        };


    // =================================================
    // CONNECTION STATE
    // =================================================

    peerConnection.onconnectionstatechange =
        () => {

            if (!peerConnection) {

                return;

            }


            const state =
                peerConnection.connectionState;


            console.log(
                "🔗 CONNECTION STATE:",
                state
            );


            switch (state) {

                case "new":

                    setCallStatus(
                        "Connecting..."
                    );

                    break;


                case "connecting":

                    setCallStatus(
                        "Connecting..."
                    );

                    break;


                case "connected":

                    setCallStatus(
                        "Connected"
                    );

                    break;


                case "disconnected":

                    setCallStatus(
                        "Connection interrupted"
                    );

                    break;


                case "failed":

                    setCallStatus(
                        "Connection failed"
                    );

                    break;


                case "closed":

                    setCallStatus(
                        "Call ended"
                    );

                    break;

            }

        };


    // =================================================
    // ICE CONNECTION STATE
    // =================================================

    peerConnection.oniceconnectionstatechange =
        () => {

            if (!peerConnection) {

                return;

            }


            console.log(
                "🧊 ICE STATE:",
                peerConnection.iceConnectionState
            );


            if (
                peerConnection.iceConnectionState ===
                "failed"
            ) {

                setCallStatus(
                    "Connection failed"
                );

            }

        };


    // =================================================
    // ADD LOCAL MICROPHONE
    // =================================================

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                track => {

                    peerConnection.addTrack(
                        track,
                        localStream
                    );

                }
            );

    }


    return peerConnection;

}


// =====================================================
// LISTEN FOR REMOTE ICE
// =====================================================

function listenForRemoteCandidates() {

    if (!callId) {

        console.error(
            "❌ NO CALL ID FOR ICE"
        );

        return;

    }


    const collectionName =
        isCaller
            ? "receiverCandidates"
            : "callerCandidates";


    console.log(
        "👂 LISTENING FOR:",
        collectionName
    );


    unsubscribeRemoteCandidates =
        onSnapshot(

            collection(
                db,
                "calls",
                callId,
                collectionName
            ),

            async snapshot => {

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


                    const candidateId =
                        change.doc.id;


                    // Prevent duplicate ICE
                    if (
                        addedRemoteCandidateIds
                            .has(candidateId)
                    ) {

                        continue;

                    }


                    addedRemoteCandidateIds
                        .add(candidateId);


                    const candidate =
                        change.doc.data();


                    // =================================================
                    // REMOTE DESCRIPTION NOT READY
                    // =================================================

                    if (
                        !peerConnection ||
                        !remoteDescriptionReady
                    ) {

                        pendingCandidates.push(
                            candidate
                        );


                        console.log(
                            "⏳ ICE QUEUED"
                        );


                        continue;

                    }


                    // =================================================
                    // ADD ICE
                    // =================================================

                    try {

                        await peerConnection
                            .addIceCandidate(
                                new RTCIceCandidate(
                                    candidate
                                )
                            );


                        console.log(
                            "✅ REMOTE ICE ADDED"
                        );


                    } catch (error) {

                        console.error(
                            "❌ REMOTE ICE ERROR:",
                            error
                        );

                    }

                }

            },

            error => {

                console.error(
                    "❌ ICE LISTENER ERROR:",
                    error
                );

            }

        );

}


// =====================================================
// FLUSH PENDING ICE
// =====================================================

async function flushPendingCandidates() {

    if (
        !peerConnection ||
        !remoteDescriptionReady
    ) {

        return;

    }


    console.log(
        "🧊 FLUSHING ICE:",
        pendingCandidates.length
    );


    while (
        pendingCandidates.length > 0
    ) {

        const candidate =
            pendingCandidates.shift();


        try {

            await peerConnection
                .addIceCandidate(
                    new RTCIceCandidate(
                        candidate
                    )
                );


            console.log(
                "✅ QUEUED ICE ADDED"
            );


        } catch (error) {

            console.error(
                "❌ QUEUED ICE ERROR:",
                error
            );

        }

    }

}


// =====================================================
// CREATE CALL
// =====================================================

async function createCall() {

    const callRef =
        doc(
            collection(
                db,
                "calls"
            )
        );


    callId =
        callRef.id;


    await setDoc(
        callRef,
        {

            callerId:
                currentUser.uid,

            receiverId:
                receiverId,

            type:
                "voice",

            status:
                "ringing",

            createdAt:
                serverTimestamp(),

            endedAt:
                null,

            endedBy:
                null

        }
    );


    console.log(
        "📞 CALL CREATED:",
        callId
    );

}


// =====================================================
// LISTEN CALL STATUS
// =====================================================

function listenForCallStatus() {

    if (!callId) {

        return;

    }


    unsubscribeCall =
        onSnapshot(

            doc(
                db,
                "calls",
                callId
            ),

            snapshot => {

                if (
                    !snapshot.exists()
                ) {

                    return;

                }


                const data =
                    snapshot.data();


                console.log(
                    "📞 CALL STATUS:",
                    data.status
                );

                console.log(
    "📞 FIRESTORE CALL STATUS RECEIVED:",
    data.status
);

                if (
    data.status ===
    "ended"
) {

    console.log(
        "📞 REMOTE USER ENDED THE CALL"
    );

    cleanupCall(true);

    return;

                }


                if (
                    data.status ===
                    "connected"
                ) {

                    if (
                        peerConnection &&
                        peerConnection.connectionState !==
                        "connected"
                    ) {

                        console.log(
                            "📞 SIGNALING CONNECTED — WAITING FOR WEBRTC"
                        );

                    }

                }

            },

            error => {

                console.error(
                    "❌ CALL STATUS ERROR:",
                    error
                );

            }

        );

}


// =====================================================
// START CALLER
// =====================================================

async function startCallerCall() {

    isCaller =
        true;

    callEnded =
        false;

    remoteDescriptionReady =
        false;

    pendingCandidates =
        [];

    addedRemoteCandidateIds =
        new Set();


    setCallStatus(
        "Calling..."
    );


    // =================================================
    // 1. MICROPHONE
    // =================================================

    await getMicrophone();


    // =================================================
    // 2. CREATE CALL
    // =================================================

    await createCall();


    // =================================================
    // 3. CREATE PEER
    // =================================================

    createPeerConnection();


    // =================================================
    // 4. START LISTENERS BEFORE OFFER
    // =================================================

    listenForRemoteCandidates();

    listenForCallStatus();


    // =================================================
    // 5. CREATE OFFER
    // =================================================

    const offer =
        await peerConnection
            .createOffer();


    await peerConnection
        .setLocalDescription(
            offer
        );


    // =================================================
    // 6. SAVE OFFER
    // =================================================

    await setDoc(

        doc(
            db,
            "calls",
            callId,
            "offer",
            "data"
        ),

        {

            type:
                offer.type,

            sdp:
                offer.sdp

        }

    );


    console.log(
        "📤 OFFER SENT:",
        callId
    );


    // =================================================
    // 7. LISTEN FOR ANSWER
    // =================================================

    unsubscribeAnswer =
        onSnapshot(

            doc(
                db,
                "calls",
                callId,
                "answer",
                "data"
            ),

            async snapshot => {

                if (
                    !snapshot.exists() ||
                    !peerConnection ||
                    callEnded
                ) {

                    return;

                }


                if (
                    peerConnection
                        .currentRemoteDescription
                ) {

                    return;

                }


                try {

                    const answer =
                        snapshot.data();


                    console.log(
                        "📥 ANSWER RECEIVED"
                    );


                    await peerConnection
                        .setRemoteDescription(

                            new RTCSessionDescription(
                                answer
                            )

                        );


                    remoteDescriptionReady =
                        true;


                    await flushPendingCandidates();


                    console.log(
                        "✅ REMOTE DESCRIPTION READY"
                    );


                } catch (error) {

                    console.error(
                        "❌ ANSWER ERROR:",
                        error
                    );


                    setCallStatus(
                        "Connection failed"
                    );

                }

            },

            error => {

                console.error(
                    "❌ ANSWER LISTENER ERROR:",
                    error
                );

            }

        );

}


// =====================================================
// START RECEIVER
// =====================================================

async function startReceiverCall() {

    isCaller =
        false;

    callEnded =
        false;

    remoteDescriptionReady =
        false;

    pendingCandidates =
        [];

    addedRemoteCandidateIds =
        new Set();


    if (!callId) {

        throw new Error(
            "Missing incoming call ID"
        );

    }


    console.log(
        "📲 RECEIVING CALL:",
        callId
    );


    setCallStatus(
        "Connecting..."
    );


    // =================================================
    // 1. MICROPHONE
    // =================================================

    await getMicrophone();


    // =================================================
    // 2. CREATE PEER
    // =================================================

    createPeerConnection();


    // =================================================
    // 3. START LISTENERS
    // =================================================

    listenForRemoteCandidates();

    listenForCallStatus();


    // =================================================
    // 4. LISTEN FOR OFFER
    // =================================================

    unsubscribeOffer =
        onSnapshot(

            doc(
                db,
                "calls",
                callId,
                "offer",
                "data"
            ),

            async snapshot => {

                if (
                    !snapshot.exists() ||
                    !peerConnection ||
                    callEnded
                ) {

                    return;

                }


                if (
                    peerConnection
                        .currentRemoteDescription
                ) {

                    return;

                }


                try {

                    const offer =
                        snapshot.data();


                    console.log(
                        "📥 OFFER RECEIVED"
                    );


                    // =================================================
                    // 5. SET REMOTE OFFER
                    // =================================================

                    await peerConnection
                        .setRemoteDescription(

                            new RTCSessionDescription(
                                offer
                            )

                        );


                    remoteDescriptionReady =
                        true;


                    await flushPendingCandidates();


                    // =================================================
                    // 6. CREATE ANSWER
                    // =================================================

                    const answer =
                        await peerConnection
                            .createAnswer();


                    await peerConnection
                        .setLocalDescription(
                            answer
                        );


                    // =================================================
                    // 7. SAVE ANSWER
                    // =================================================

                    await setDoc(

                        doc(
                            db,
                            "calls",
                            callId,
                            "answer",
                            "data"
                        ),

                        {

                            type:
                                answer.type,

                            sdp:
                                answer.sdp

                        }

                    );


                    // =================================================
                    // 8. MARK SIGNALING CONNECTED
                    // =================================================

                    await setDoc(

                        doc(
                            db,
                            "calls",
                            callId
                        ),

                        {

                            status:
                                "connected"

                        },

                        {
                            merge: true
                        }

                    );


                    console.log(
                        "📤 ANSWER SENT"
                    );


                } catch (error) {

                    console.error(
                        "❌ RECEIVER ERROR:",
                        error
                    );


                    setCallStatus(
                        "Connection failed"
                    );

                }

            },

            error => {

                console.error(
                    "❌ OFFER LISTENER ERROR:",
                    error
                );

            }

        );

}


// =====================================================
// END CALL
// =====================================================

async function endCall() {

    console.log(
        "🛑 END CALL PRESSED"
    );


    if (callEnded) {

        return;

    }


    callEnded =
        true;


    setCallStatus(
        "Ending call..."
    );


    if (callId) {

        try {

            await setDoc(

                doc(
                    db,
                    "calls",
                    callId
                ),

                {

                    status:
                        "ended",

                    endedAt:
                        serverTimestamp(),

                    endedBy:
                        currentUser
                            ? currentUser.uid
                            : null

                },

                {
                    merge: true
                }

            );


            console.log(
                "✅ CALL MARKED ENDED"
            );


        } catch (error) {

            console.error(
                "❌ END CALL FIRESTORE ERROR:",
                error
            );

        }

    }


    cleanupCall(
        true
    );

}


// =====================================================
// CLEANUP
// =====================================================

function cleanupCall(
    goBack = true
) {

    console.log(
    "🧹 CLEANUP CALL TRIGGERED",
    {
        callId: callId,
        callEnded: callEnded,
        isCaller: isCaller,
        goBack: goBack
    }
);

if (callEnded === false) {

    callEnded =
        true;

}


    // =================================================
    // STOP CALL LISTENER
    // =================================================

    if (unsubscribeCall) {

        unsubscribeCall();

        unsubscribeCall =
            null;

    }


    // =================================================
    // STOP ANSWER LISTENER
    // =================================================

    if (unsubscribeAnswer) {

        unsubscribeAnswer();

        unsubscribeAnswer =
            null;

    }


    // =================================================
    // STOP OFFER LISTENER
    // =================================================

    if (unsubscribeOffer) {

        unsubscribeOffer();

        unsubscribeOffer =
            null;

    }


    // =================================================
    // STOP ICE LISTENER
    // =================================================

    if (unsubscribeRemoteCandidates) {

        unsubscribeRemoteCandidates();

        unsubscribeRemoteCandidates =
            null;

    }


    // =================================================
    // STOP MICROPHONE
    // =================================================

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


    // =================================================
    // STOP REMOTE AUDIO
    // =================================================

    if (remoteStream) {

        remoteStream
            .getTracks()
            .forEach(
                track => {

                    track.stop();

                }
            );


        remoteStream =
            null;

    }


    // =================================================
    // CLEAR AUDIO
    // =================================================

    if (remoteAudio) {

        remoteAudio.pause();

        remoteAudio.srcObject =
            null;

    }


    // =================================================
    // CLOSE PEER
    // =================================================

    if (peerConnection) {

        peerConnection.close();

        peerConnection =
            null;

    }


    pendingCandidates =
        [];

    addedRemoteCandidateIds =
        new Set();

    remoteDescriptionReady =
        false;


    setCallStatus(
        "Call ended"
    );


    // =================================================
    // RETURN TO CHATS
    // =================================================

    if (goBack) {

        setTimeout(
            () => {

                window.location.href =
                    "chat.html";

            },
            700
        );

    }

}


// =====================================================
// MUTE
// =====================================================

if (muteBtn) {

    muteBtn.addEventListener(
        "click",
        () => {

            if (!localStream) {

                return;

            }


            const tracks =
                localStream
                    .getAudioTracks();


            if (!tracks.length) {

                return;

            }


            const currentlyEnabled =
                tracks[0].enabled;


            tracks.forEach(
                track => {

                    track.enabled =
                        !currentlyEnabled;

                }
            );


            muteBtn.classList.toggle(
                "active",
                currentlyEnabled
            );


            if (
                currentlyEnabled
            ) {

                muteBtn.innerHTML =
                    '<i class="fa-solid fa-microphone-slash"></i>';

            } else {

                muteBtn.innerHTML =
                    '<i class="fa-solid fa-microphone"></i>';

            }

        }
    );

}


// =====================================================
// END BUTTON
// =====================================================

if (endCallBtn) {

    endCallBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            event.stopPropagation();


            console.log(
                "🛑 END BUTTON CLICKED"
            );


            await endCall();

        }
    );

}


// =====================================================
// BACK BUTTON
// =====================================================

if (backBtn) {

    backBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            event.stopPropagation();


            await endCall();

        }
    );

}


// =====================================================
// AUTH
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


        if (!receiverId) {

            alert(
                "No user selected."
            );


            window.location.href =
                "chats.html";


            return;

        }


        if (
            receiverId ===
            currentUser.uid
        ) {

            alert(
                "You cannot call yourself."
            );


            window.location.href =
                "chats.html";


            return;

        }


        try {

            // =================================================
            // INCOMING CALL
            // =================================================

            if (incomingCallId) {

                console.log(
                    "📲 INCOMING CALL:",
                    incomingCallId
                );


                const callSnap =
                    await getDoc(

                        doc(
                            db,
                            "calls",
                            incomingCallId
                        )

                    );


                if (
                    !callSnap.exists()
                ) {

                    throw new Error(
                        "Call no longer exists"
                    );

                }


                const callData =
                    callSnap.data();


                // =================================================
                // VERIFY CALL
                // =================================================

                if (
                    callData.receiverId !==
                    currentUser.uid
                ) {

                    throw new Error(
                        "This call is not for this user"
                    );

                }


                if (
                    callData.callerId ===
                    currentUser.uid
                ) {

                    throw new Error(
                        "Invalid call"
                    );

                }


                if (
                    callData.type !==
                    "voice"
                ) {

                    throw new Error(
                        "Invalid voice call"
                    );

                }


                if (
                    callData.status ===
                    "ended"
                ) {

                    throw new Error(
                        "Call already ended"
                    );

                }


                // =================================================
                // IMPORTANT:
                // For incoming calls, the remote user
                // is the CALLER, not receiverId.
                // =================================================

                await loadRemoteUser(
                    callData.callerId
                );


                callId =
                    incomingCallId;


                await startReceiverCall();


                return;

            }


            // =================================================
            // OUTGOING CALL
            // =================================================

            console.log(
                "📞 OUTGOING CALL"
            );


            await loadRemoteUser(
                receiverId
            );


            await startCallerCall();


        } catch (error) {

    console.error(
        "❌ VOICE CALL START ERROR:",
        error
    );

    console.error(
        "❌ ERROR MESSAGE:",
        error?.message
    );

    console.error(
        "❌ ERROR CODE:",
        error?.code
    );

    setCallStatus(
    "Unable to start: " +
    (error.message || "Unknown error")
);

        }

    }

);


// =====================================================
// PAGE CLOSE
// =====================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (localStream) {

            localStream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );

        }


        if (peerConnection) {

            peerConnection.close();

        }

    }
);
