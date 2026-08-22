import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    addDoc,
    collection,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =====================================================
// MATCHCONNECT — ONE-TO-ONE VOICE CALL
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

const voiceConnectionStatus =
    document.getElementById(
        "voiceConnectionStatus"
    );

const muteBtn =
    document.getElementById("muteBtn");

const endCallBtn =
    document.getElementById("endCallBtn");

const backBtn =
    document.getElementById("backBtn");


// =====================================================
// URL PARAMETERS
// =====================================================

const params =
    new URLSearchParams(
        window.location.search
    );

const receiverId =
    params.get("receiverId");


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;

let remoteUser = null;

let callId = null;

let peerConnection = null;

let localStream = null;

let remoteStream = null;

let isCaller = false;

let callEnded = false;

let remoteDescriptionReady = false;

let pendingCandidates = [];

let unsubscribeCall = null;

let unsubscribeAnswer = null;

let unsubscribeRemoteCandidates = null;

let unsubscribeOffer = null;


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
// PROFILE
// =====================================================

async function getUserProfile(uid) {

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "users",
                    uid
                )
            );

        if (snapshot.exists()) {

            const data =
                snapshot.data();

            return {

                name:
                    data.name ||
                    data.username ||
                    "User",

                photoURL:
                    data.photoURL ||
                    "images/default-avatar.png"

            };

        }

    } catch (error) {

        console.error(
            "❌ Profile error:",
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
// LOAD REMOTE USER
// =====================================================

async function loadRemoteUser() {

    if (!receiverId) {
        return;
    }

    remoteUser =
        await getUserProfile(
            receiverId
        );


    if (callerName) {

        callerName.textContent =
            remoteUser.name;

    }


    if (callerPhoto) {

        callerPhoto.src =
            remoteUser.photoURL;

    }


    if (voiceAvatarName) {

        voiceAvatarName.textContent =
            remoteUser.name;

    }


    if (voiceAvatarPhoto) {

        voiceAvatarPhoto.src =
            remoteUser.photoURL;

    }

}


// =====================================================
// STATUS UI
// =====================================================

function setCallStatus(text) {

    if (callStatus) {

        callStatus.textContent =
            text;

    }


    if (voiceConnectionStatus) {

        voiceConnectionStatus.textContent =
            text;

    }

}


// =====================================================
// GET MICROPHONE
// =====================================================

async function getLocalAudio() {

    if (localStream) {

        return localStream;

    }


    localStream =
        await navigator
            .mediaDevices
            .getUserMedia({

                audio: true,

                video: false

            });


    return localStream;

}


// =====================================================
// CREATE PEER CONNECTION
// =====================================================

function createPeerConnection() {

    if (peerConnection) {

        return peerConnection;

    }


    peerConnection =
        new RTCPeerConnection(
            rtcConfiguration
        );


    remoteStream =
        new MediaStream();


    // =================================================
    // REMOTE AUDIO
    // =================================================

    const remoteAudio =
        new Audio();

    remoteAudio.autoplay = true;

    remoteAudio.playsInline = true;

    remoteAudio.srcObject =
        remoteStream;


    window.matchConnectRemoteAudio =
        remoteAudio;


    // =================================================
    // REMOTE TRACK
    // =================================================

    peerConnection.ontrack =
        event => {

            console.log(
                "🔊 Remote audio track received"
            );


            if (
                event.track &&
                !remoteStream
                    .getTracks()
                    .some(
                        track =>
                            track.id ===
                            event.track.id
                    )
            ) {

                remoteStream.addTrack(
                    event.track
                );

            }


            remoteAudio.srcObject =
                remoteStream;


            remoteAudio
                .play()
                .catch(
                    error => {

                        console.warn(
                            "⚠️ Remote audio play:",
                            error
                        );

                    }
                );


            setCallStatus(
                "Connected"
            );

        };


    // =================================================
    // ICE CANDIDATE
    // =================================================

    peerConnection.onicecandidate =
        async event => {

            if (
                !event.candidate ||
                !callId
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
                    "🧊 Voice ICE saved:",
                    collectionName
                );

            } catch (error) {

                console.error(
                    "❌ Voice ICE save error:",
                    error
                );

            }

        };


    // =================================================
    // CONNECTION STATE
    // =================================================

    peerConnection
        .onconnectionstatechange =
        () => {

            if (!peerConnection) {

                return;

            }


            const state =
                peerConnection
                    .connectionState;


            console.log(
                "🔗 Voice connection:",
                state
            );


            if (
                state ===
                "connecting"
            ) {

                setCallStatus(
                    "Connecting..."
                );

            }


            if (
                state ===
                "connected"
            ) {

                setCallStatus(
                    "Connected"
                );

            }


            if (
                state ===
                "disconnected"
            ) {

                setCallStatus(
                    "Connection interrupted"
                );

            }


            if (
                state ===
                "failed"
            ) {

                setCallStatus(
                    "Connection failed"
                );

            }


            if (
                state ===
                "closed"
            ) {

                setCallStatus(
                    "Call ended"
                );

            }

        };


    // =================================================
    // ICE CONNECTION STATE
    // =================================================

    peerConnection
        .oniceconnectionstatechange =
        () => {

            if (!peerConnection) {

                return;

            }


            console.log(
                "🧊 Voice ICE:",
                peerConnection
                    .iceConnectionState
            );

        };


    // =================================================
    // ADD MICROPHONE TRACK
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

        return;

    }


    const collectionName =
        isCaller
            ? "receiverCandidates"
            : "callerCandidates";


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


                    const candidate =
                        change.doc.data();


                    if (
                        !peerConnection ||
                        !remoteDescriptionReady
                    ) {

                        pendingCandidates.push(
                            candidate
                        );

                        continue;

                    }


                    try {

                        await peerConnection
                            .addIceCandidate(
                                new RTCIceCandidate(
                                    candidate
                                )
                            );


                        console.log(
                            "✅ Remote voice ICE added"
                        );

                    } catch (error) {

                        console.error(
                            "❌ Remote voice ICE error:",
                            error
                        );

                    }

                }

            }
        );

}


// =====================================================
// FLUSH ICE
// =====================================================

async function flushPendingCandidates() {

    if (
        !peerConnection ||
        !remoteDescriptionReady
    ) {

        return;

    }


    while (
        pendingCandidates.length
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

        } catch (error) {

            console.error(
                "❌ Pending voice ICE error:",
                error
            );

        }

    }

}


// =====================================================
// CREATE CALL DOCUMENT
// =====================================================

async function createCallDocument() {

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
        "📞 Voice call created:",
        callId
    );


    return callId;

}


// =====================================================
// LISTEN FOR CALL STATUS
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
                    "📞 Voice call status:",
                    data.status
                );


                if (
                    data.status ===
                    "ended"
                ) {

                    cleanupCall(
                        false
                    );

                }

            }
        );

}


// =====================================================
// START OUTGOING CALL
// =====================================================

async function startCallerCall() {

    isCaller = true;

    callEnded = false;

    remoteDescriptionReady =
        false;

    pendingCandidates = [];


    setCallStatus(
        "Calling..."
    );


    await getLocalAudio();

    createPeerConnection();

    callId =
        await createCallDocument();


    listenForRemoteCandidates();

    listenForCallStatus();


    const offer =
        await peerConnection
            .createOffer();


    await peerConnection
        .setLocalDescription(
            offer
        );


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
        "📤 Voice offer sent"
    );


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


                    await peerConnection
                        .setRemoteDescription(
                            new RTCSessionDescription(
                                answer
                            )
                        );


                    remoteDescriptionReady =
                        true;


                    await flushPendingCandidates();


                    setCallStatus(
                        "Connected"
                    );


                    console.log(
                        "📥 Voice answer received"
                    );

                } catch (error) {

                    console.error(
                        "❌ Voice answer error:",
                        error
                    );

                }

            }
        );

}


// =====================================================
// START INCOMING CALL
// =====================================================

async function startReceiverCall() {

    isCaller = false;

    callEnded = false;

    remoteDescriptionReady =
        false;

    pendingCandidates = [];


    if (!callId) {

        console.error(
            "❌ No voice call ID"
        );

        return;

    }


    setCallStatus(
        "Connecting..."
    );


    await getLocalAudio();

    createPeerConnection();

    listenForRemoteCandidates();

    listenForCallStatus();


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


                    await peerConnection
                        .setRemoteDescription(
                            new RTCSessionDescription(
                                offer
                            )
                        );


                    remoteDescriptionReady =
                        true;


                    await flushPendingCandidates();


                    const answer =
                        await peerConnection
                            .createAnswer();


                    await peerConnection
                        .setLocalDescription(
                            answer
                        );


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


                    setCallStatus(
                        "Connected"
                    );


                    console.log(
                        "📤 Voice answer sent"
                    );

                } catch (error) {

                    console.error(
                        "❌ Voice receiver error:",
                        error
                    );

                }

            }
        );

}


// =====================================================
// END CALL
// =====================================================

async function endCall() {

    if (callEnded) {

        return;

    }


    callEnded = true;


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
                            ?.uid ||
                        null

                },
                {
                    merge: true
                }
            );


        } catch (error) {

            console.error(
                "❌ Voice end call error:",
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

    callEnded = true;


    // =================================================
    // FIRESTORE LISTENERS
    // =================================================

    if (unsubscribeCall) {

        unsubscribeCall();

        unsubscribeCall =
            null;

    }


    if (unsubscribeAnswer) {

        unsubscribeAnswer();

        unsubscribeAnswer =
            null;

    }


    if (unsubscribeRemoteCandidates) {

        unsubscribeRemoteCandidates();

        unsubscribeRemoteCandidates =
            null;

    }


    if (unsubscribeOffer) {

        unsubscribeOffer();

        unsubscribeOffer =
            null;

    }


    // =================================================
    // MICROPHONE
    // =================================================

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        localStream = null;

    }


    // =================================================
    // REMOTE AUDIO
    // =================================================

    if (remoteStream) {

        remoteStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        remoteStream = null;

    }


    if (
        window.matchConnectRemoteAudio
    ) {

        window
            .matchConnectRemoteAudio
            .pause();

        window
            .matchConnectRemoteAudio
            .srcObject =
            null;

        window
            .matchConnectRemoteAudio =
            null;

    }


    // =================================================
    // PEER CONNECTION
    // =================================================

    if (peerConnection) {

        peerConnection.ontrack =
            null;

        peerConnection.onicecandidate =
            null;

        peerConnection.onconnectionstatechange =
            null;

        peerConnection.oniceconnectionstatechange =
            null;

        peerConnection.close();

        peerConnection =
            null;

    }


    pendingCandidates = [];

    remoteDescriptionReady =
        false;


    setCallStatus(
        "Call ended"
    );


    // =================================================
    // RETURN TO PREVIOUS PAGE
    // =================================================

    if (goBack) {

        setTimeout(
            () => {

                if (
                    window.history.length >
                    1
                ) {

                    window.history.back();

                } else {

                    window.location.href =
                        "chats.html";

                }

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


            const enabled =
                tracks[0].enabled;


            tracks.forEach(
                track => {

                    track.enabled =
                        !enabled;

                }
            );


            muteBtn.classList.toggle(
                "active",
                enabled
            );


            muteBtn.innerHTML =
                enabled
                    ?
                    '<i class="fa-solid fa-microphone-slash"></i>'
                    :
                    '<i class="fa-solid fa-microphone"></i>';

        }
    );

}


// =====================================================
// END BUTTON
// =====================================================

if (endCallBtn) {

    endCallBtn.addEventListener(
        "click",
        endCall
    );

}


// =====================================================
// BACK BUTTON
// =====================================================

if (backBtn) {

    backBtn.addEventListener(
        "click",
        endCall
    );

}


// =====================================================
// AUTHENTICATION
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

            await loadRemoteUser();


            // =================================================
            // LOOK FOR EXISTING INCOMING VOICE CALL
            // =================================================

            const incomingCallRef =
                collection(
                    db,
                    "calls"
                );


            let incomingCallId =
                null;


            const snapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        currentUser.uid
                    )
                );


            // Keep profile read isolated.
            // The actual incoming-call detection
            // will be handled below.


            console.log(
                "👤 Voice call user ready:",
                currentUser.uid
            );


            // =================================================
            // TEMPORARY OUTGOING / INCOMING DECISION
            // =================================================

            // We determine whether there is a ringing
            // voice call from this exact user.

            const callsQuery =
                await import(
                    "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
                );


            const incomingQuery =
                callsQuery.query(
                    callsQuery.collection(
                        db,
                        "calls"
                    ),
                    callsQuery.where(
                        "receiverId",
                        "==",
                        currentUser.uid
                    )
                );


            const incomingSnapshot =
                await callsQuery.getDocs(
                    incomingQuery
                );


            for (
                const callDoc
                of incomingSnapshot.docs
            ) {

                const data =
                    callDoc.data();


                if (
                    data.type ===
                    "voice" &&
                    data.status ===
                    "ringing" &&
                    data.callerId ===
                    receiverId
                ) {

                    incomingCallId =
                        callDoc.id;

                    break;

                }

            }


            if (incomingCallId) {

                callId =
                    incomingCallId;


                console.log(
                    "📲 INCOMING VOICE CALL:",
                    callId
                );


                await startReceiverCall();

            } else {

                console.log(
                    "📞 STARTING OUTGOING VOICE CALL"
                );


                await startCallerCall();

            }

        } catch (error) {

            console.error(
                "❌ Voice call initialization error:",
                error
            );


            setCallStatus(
                "Unable to start voice call"
            );


            cleanupCall(
                true
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
                    track => track.stop()
                );

        }


        if (peerConnection) {

            peerConnection.close();

        }

    }
);
