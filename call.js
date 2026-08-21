import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    collection,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =====================================================
// MATCHCONNECT — PERMANENT ONE-TO-ONE CALL SYSTEM
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

const remoteVideo =
    document.getElementById("remoteVideo");

const localVideo =
    document.getElementById("localVideo");

const voiceAvatar =
    document.getElementById("voiceAvatar");

const voiceAvatarPhoto =
    document.getElementById("voiceAvatarPhoto");

const voiceAvatarName =
    document.getElementById("voiceAvatarName");

const muteBtn =
    document.getElementById("muteBtn");

const cameraBtn =
    document.getElementById("cameraBtn");

const switchCameraBtn =
    document.getElementById("switchCameraBtn");

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

const callType =
    params.get("type") === "voice"
        ? "voice"
        : "video";


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

let unsubscribeRemoteCandidates = null;

let unsubscribeAnswer = null;

let localCameraFacingMode = "user";


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
// CALL ID
// =====================================================
// Each new call gets a NEW unique ID.
// This prevents an old "ended" call from affecting
// a new call between the same two users.

function createCallId() {

    return `${currentUser.uid}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 10)}`;

}


// =====================================================
// INITIAL UI
// =====================================================

if (callType === "voice") {

    document.body.classList.add(
        "voice-mode"
    );

    document.body.classList.remove(
        "video-mode"
    );

    if (cameraBtn) {
        cameraBtn.style.display = "none";
    }

    if (switchCameraBtn) {
        switchCameraBtn.style.display = "none";
    }

} else {

    document.body.classList.add(
        "video-mode"
    );

    document.body.classList.remove(
        "voice-mode"
    );

}


// =====================================================
// GET USER PROFILE
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

async function loadRemoteUser(uid) {

    if (!uid) return;

    remoteUser =
        await getUserProfile(uid);

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
// GET LOCAL MEDIA
// =====================================================

async function getLocalMedia() {

    if (localStream) {
        return localStream;
    }

    const constraints = {

        audio: true,

        video:
            callType === "video"

    };

    localStream =
        await navigator
            .mediaDevices
            .getUserMedia(
                constraints
            );


    if (
        callType === "video" &&
        localVideo
    ) {

        localVideo.srcObject =
            localStream;

        localVideo.muted = true;

        localVideo.autoplay = true;

        localVideo.playsInline = true;

    }

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


    // =================================================
    // CREATE REMOTE STREAM
    // =================================================

    remoteStream =
        new MediaStream();


    if (remoteVideo) {

        remoteVideo.srcObject =
            remoteStream;

        remoteVideo.autoplay = true;

        remoteVideo.playsInline = true;

    }


    // =================================================
    // REMOTE TRACK
    // =================================================

    peerConnection.ontrack =
        (event) => {

            console.log(
                "📡 Remote track:",
                event.track.kind
            );


            const streams =
                event.streams;


            if (
                streams &&
                streams[0]
            ) {

                streams[0]
                    .getTracks()
                    .forEach(
                        track => {

                            const exists =
                                remoteStream
                                    .getTracks()
                                    .some(
                                        existing =>
                                            existing.id ===
                                            track.id
                                    );


                            if (!exists) {

                                remoteStream.addTrack(
                                    track
                                );

                            }

                        }
                    );

            } else {

                remoteStream.addTrack(
                    event.track
                );

            }


            if (remoteVideo) {

                remoteVideo.srcObject =
                    remoteStream;

                remoteVideo
                    .play()
                    .catch(
                        () => {}
                    );

            }


            if (callStatus) {

                callStatus.textContent =
                    "Connected";

            }

        };


    // =================================================
    // ICE CANDIDATES
    // =================================================

    peerConnection.onicecandidate =
        async (event) => {

            if (
                !event.candidate ||
                !callId
            ) {

                return;

            }


            const candidateCollection =
                isCaller
                    ? "callerCandidates"
                    : "receiverCandidates";


            try {

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

            if (!peerConnection) {
                return;
            }

            const state =
                peerConnection.connectionState;


            console.log(
                "🔗 Connection state:",
                state
            );


            if (
                state === "connecting"
            ) {

                if (callStatus) {
                    callStatus.textContent =
                        "Connecting...";
                }

            }


            if (
                state === "connected"
            ) {

                if (callStatus) {
                    callStatus.textContent =
                        "Connected";
                }

            }


            if (
                state === "disconnected"
            ) {

                if (callStatus) {
                    callStatus.textContent =
                        "Connection lost";
                }

            }


            if (
                state === "failed"
            ) {

                if (callStatus) {
                    callStatus.textContent =
                        "Connection failed";
                }

            }


            if (
                state === "closed"
            ) {

                if (callStatus) {
                    callStatus.textContent =
                        "Call ended";
                }

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
                "🧊 ICE state:",
                peerConnection
                    .iceConnectionState
            );

        };


    // =================================================
    // ADD LOCAL TRACKS
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


    const candidateCollection =
        isCaller
            ? "receiverCandidates"
            : "callerCandidates";


    const candidatesRef =
        collection(
            db,
            "calls",
            callId,
            candidateCollection
        );


    unsubscribeRemoteCandidates =
        onSnapshot(
            candidatesRef,
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
                            "✅ Remote ICE added"
                        );

                    } catch (error) {

                        console.error(
                            "❌ Remote ICE error:",
                            error
                        );

                    }

                }

            }
        );

}


// =====================================================
// FLUSH WAITING ICE
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
                "❌ Pending ICE error:",
                error
            );

        }

    }

}


// =====================================================
// CREATE CALL DOCUMENT
// =====================================================

async function createCallDocument() {

    callId =
        createCallId(
            currentUser.uid,
            receiverId
        );


    await setDoc(
        doc(
            db,
            "calls",
            callId
        ),
        {

            callerId:
                currentUser.uid,

            receiverId:
                receiverId,

            type:
                callType,

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


    return callId;

}


// =====================================================
// CALLER
// =====================================================

async function startCallerCall() {

    isCaller = true;

    callEnded = false;

    remoteDescriptionReady =
        false;

    pendingCandidates = [];


    if (callStatus) {

        callStatus.textContent =
            "Calling...";

    }


    await getLocalMedia();

    createPeerConnection();


    callId =
        await createCallDocument();


    listenForRemoteCandidates();


    // =================================================
    // CREATE OFFER
    // =================================================

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
        "📤 Offer sent"
    );


    // =================================================
    // LISTEN FOR ANSWER
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


                const answer =
                    snapshot.data();


                try {

                    await peerConnection
                        .setRemoteDescription(
                            new RTCSessionDescription(
                                answer
                            )
                        );


                    remoteDescriptionReady =
                        true;


                    await flushPendingCandidates();


                    if (callStatus) {

                        callStatus.textContent =
                            "Connected";

                    }


                    console.log(
                        "📥 Answer received"
                    );

                } catch (error) {

                    console.error(
                        "❌ Answer error:",
                        error
                    );

                }

            }
        );


    listenForCallStatus();

}


// =====================================================
// RECEIVER
// =====================================================

async function startReceiverCall() {

    isCaller = false;

    callEnded = false;

    remoteDescriptionReady =
        false;

    pendingCandidates = [];


    callId =
        createCallId(
            currentUser.uid,
            receiverId
        );


    if (callStatus) {

        callStatus.textContent =
            "Connecting...";

    }


    await getLocalMedia();

    createPeerConnection();


    listenForRemoteCandidates();

    listenForCallStatus();


    // =================================================
    // LISTEN FOR OFFER
    // =================================================

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


            const offer =
                snapshot.data();


            try {

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
                // CREATE ANSWER
                // =================================================

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


                await updateDoc(
                    doc(
                        db,
                        "calls",
                        callId
                    ),
                    {

                        status:
                            "connected"

                    }
                );


                if (callStatus) {

                    callStatus.textContent =
                        "Connected";

                }


                console.log(
                    "📤 Answer sent"
                );

            } catch (error) {

                console.error(
                    "❌ Receiver answer error:",
                    error
                );

            }

        }
    );

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


                if (
                    data.status ===
                    "ended"
                ) {

                    cleanupCall();

                }

            }
        );

}


// =====================================================
// MUTE MICROPHONE
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


            muteBtn.innerHTML =
                currentlyEnabled
                    ?
                    '<i class="fa-solid fa-microphone-slash"></i>'
                    :
                    '<i class="fa-solid fa-microphone"></i>';

        }
    );

}


// =====================================================
// CAMERA ON / OFF
// =====================================================

if (cameraBtn) {

    cameraBtn.addEventListener(
        "click",
        () => {

            if (
                callType !==
                "video"
            ) {

                return;

            }


            if (!localStream) {
                return;
            }


            const tracks =
                localStream
                    .getVideoTracks();


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


            cameraBtn.classList.toggle(
                "active",
                !currentlyEnabled
            );


            cameraBtn.innerHTML =
                currentlyEnabled
                    ?
                    '<i class="fa-solid fa-video-slash"></i>'
                    :
                    '<i class="fa-solid fa-video"></i>';

        }
    );

}


// =====================================================
// SWITCH CAMERA
// =====================================================

if (switchCameraBtn) {

    switchCameraBtn.addEventListener(
        "click",
        async () => {

            if (
                callType !==
                "video"
            ) {

                return;

            }


            if (!localStream) {
                return;
            }


            const oldTrack =
                localStream
                    .getVideoTracks()[0];


            if (!oldTrack) {
                return;
            }


            localCameraFacingMode =
                localCameraFacingMode ===
                "user"
                    ? "environment"
                    : "user";


            try {

                const newStream =
                    await navigator
                        .mediaDevices
                        .getUserMedia({

                            audio: false,

                            video: {

                                facingMode: {

                                    ideal:
                                        localCameraFacingMode

                                }

                            }

                        });


                const newTrack =
                    newStream
                        .getVideoTracks()[0];


                if (!newTrack) {
                    return;
                }


                const sender =
                    peerConnection
                        ?.getSenders()
                        .find(
                            item =>
                                item.track &&
                                item.track.kind ===
                                "video"
                        );


                if (sender) {

                    await sender
                        .replaceTrack(
                            newTrack
                        );

                }


                oldTrack.stop();


                localStream.removeTrack(
                    oldTrack
                );


                localStream.addTrack(
                    newTrack
                );


                if (localVideo) {

                    localVideo.srcObject =
                        localStream;

                }

            } catch (error) {

                console.error(
                    "❌ Camera switch error:",
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


    if (callId) {

        try {

            await updateDoc(
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

                }
            );

        } catch (error) {

            console.error(
                "❌ End call error:",
                error
            );

        }

    }


    cleanupCall();

}


// =====================================================
// CLEANUP
// =====================================================

function cleanupCall() {

    if (callEnded === false) {
        callEnded = true;
    }


    if (unsubscribeCall) {

        unsubscribeCall();

        unsubscribeCall =
            null;

    }


    if (unsubscribeRemoteCandidates) {

        unsubscribeRemoteCandidates();

        unsubscribeRemoteCandidates =
            null;

    }


    if (unsubscribeAnswer) {

        unsubscribeAnswer();

        unsubscribeAnswer =
            null;

    }


    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        localStream = null;

    }


    if (remoteStream) {

        remoteStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        remoteStream = null;

    }


    if (peerConnection) {

        peerConnection.ontrack =
            null;

        peerConnection.onicecandidate =
            null;

        peerConnection.onconnectionstatechange =
            null;

        peerConnection.close();

        peerConnection =
            null;

    }


    if (localVideo) {

        localVideo.srcObject =
            null;

    }


    if (remoteVideo) {

        remoteVideo.srcObject =
            null;

    }


    if (callStatus) {

        callStatus.textContent =
            "Call ended";

    }


    setTimeout(
        () => {

            if (
                window.history.length >
                1
            ) {

                window.history.back();

            }

        },
        700
    );

}


// =====================================================
// END CALL BUTTON
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
// AUTHENTICATION + START CALL
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

            window.history.back();

            return;

        }


        if (
            receiverId ===
            currentUser.uid
        ) {

            alert(
                "You cannot call yourself."
            );

            window.history.back();

            return;

        }


        try {

            await loadRemoteUser(
                receiverId
            );


            await getLocalMedia();


            // =================================================
            // CHECK FOR EXISTING INCOMING CALL
            // =================================================

            const existingCallId =
                createCallId(
                    currentUser.uid,
                    receiverId
                );


            const existingCallSnap =
                await getDoc(
                    doc(
                        db,
                        "calls",
                        existingCallId
                    )
                );


            if (
                existingCallSnap.exists()
            ) {

                const data =
                    existingCallSnap.data();


                if (
                    data.receiverId ===
                    currentUser.uid &&
                    data.status ===
                    "ringing"
                ) {

                    callId =
                        existingCallId;


                    await startReceiverCall();

                    return;

                }

            }


            // =================================================
            // START NEW CALL
            // =================================================

            await startCallerCall();

        } catch (error) {

            console.error(
                "❌ Call initialization error:",
                error
            );


            if (error.name ===
                "NotAllowedError") {

                callStatus.textContent =
                    "Camera/microphone permission denied.";

            } else {

                callStatus.textContent =
                    "Unable to start call.";

            }


            cleanupCall();

        }

    }
);


// =====================================================
// PAGE CLOSED
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
