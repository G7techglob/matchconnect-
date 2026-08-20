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
// WEBRTC
// =====================================================

let peerConnection = null;

let localStream = null;

let remoteStream = null;

let currentUser = null;

let remoteUser = null;

let callId = null;

let isCaller = false;

let callEnded = false;

let remoteDescriptionSet = false;

let pendingCandidates = [];

let localCameraFacingMode = "user";


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
// INITIAL UI
// =====================================================

if (callType === "voice") {

    document.body.classList.add(
        "voice-mode"
    );

    document.body.classList.remove(
        "video-mode"
    );

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

        const snap =
            await getDoc(
                doc(
                    db,
                    "users",
                    uid
                )
            );

        if (snap.exists()) {

            const data =
                snap.data();

            return {

                name:
                    data.name ||
                    "User",

                photoURL:
                    data.photoURL ||
                    "images/default-avatar.png"

            };

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
// DISPLAY REMOTE USER
// =====================================================

async function loadRemoteUser() {

    if (!receiverId) return;

    remoteUser =
        await getUserProfile(
            receiverId
        );

    callerName.textContent =
        remoteUser.name;

    callerPhoto.src =
        remoteUser.photoURL;

    voiceAvatarName.textContent =
        remoteUser.name;

    voiceAvatarPhoto.src =
        remoteUser.photoURL;

}


// =====================================================
// CREATE CALL ID
// =====================================================

function createCallId(
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
// GET MEDIA
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
        await navigator.mediaDevices
            .getUserMedia(
                constraints
            );

    if (callType === "video") {

        localVideo.srcObject =
            localStream;

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
    // REMOTE STREAM
    // =================================================

    remoteStream =
        new MediaStream();

    remoteVideo.srcObject =
        remoteStream;


    peerConnection.addEventListener(
        "track",
        (event) => {

            event.streams[0]
                .getTracks()
                .forEach(
                    (track) => {

                        const alreadyAdded =
                            remoteStream
                                .getTracks()
                                .some(
                                    existingTrack =>
                                        existingTrack.id ===
                                        track.id
                                );

                        if (!alreadyAdded) {

                            remoteStream.addTrack(
                                track
                            );

                        }

                    }
                );

            remoteVideo.play()
                .catch(() => {});

            callStatus.textContent =
                "Connected";

        }
    );


    // =================================================
    // ICE CANDIDATES
    // =================================================

    peerConnection.addEventListener(
        "icecandidate",
        async (event) => {

            if (!event.candidate) {
                return;
            }

            if (!callId) {
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

            } catch (error) {

                console.error(
                    "ICE candidate error:",
                    error
                );

            }

        }
    );


    // =================================================
    // CONNECTION STATE
    // =================================================

    peerConnection.addEventListener(
        "connectionstatechange",
        () => {

            if (!peerConnection) {
                return;
            }

            const state =
                peerConnection.connectionState;

            if (state === "connected") {

                callStatus.textContent =
                    "Connected";

            }

            if (state === "connecting") {

                callStatus.textContent =
                    "Connecting...";

            }

            if (
                state === "disconnected" ||
                state === "failed"
            ) {

                callStatus.textContent =
                    "Connection lost";

            }

            if (state === "closed") {

                callStatus.textContent =
                    "Call ended";

            }

        }
    );


    // =================================================
    // ICE CONNECTION STATE
    // =================================================

    peerConnection.addEventListener(
        "iceconnectionstatechange",
        () => {

            if (!peerConnection) {
                return;
            }

            console.log(
                "ICE state:",
                peerConnection.iceConnectionState
            );

        }
    );


    return peerConnection;

}


// =====================================================
// ADD LOCAL TRACKS
// =====================================================

function addLocalTracks() {

    if (
        !peerConnection ||
        !localStream
    ) {

        return;

    }

    const existingSenders =
        peerConnection
            .getSenders();

    localStream
        .getTracks()
        .forEach(
            (track) => {

                const alreadyExists =
                    existingSenders.some(
                        sender =>
                            sender.track &&
                            sender.track.id ===
                            track.id
                    );

                if (!alreadyExists) {

                    peerConnection.addTrack(
                        track,
                        localStream
                    );

                }

            }
        );

}


// =====================================================
// FLUSH PENDING ICE CANDIDATES
// =====================================================

async function flushPendingCandidates() {

    if (
        !peerConnection ||
        !remoteDescriptionSet
    ) {

        return;

    }

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

        } catch (error) {

            console.error(
                "Pending ICE candidate error:",
                error
            );

        }

    }

}


// =====================================================
// LISTEN FOR REMOTE ICE CANDIDATES
// =====================================================

function listenForRemoteCandidates() {

    const collectionName =
        isCaller
            ? "receiverCandidates"
            : "callerCandidates";

    const candidatesRef =
        collection(
            db,
            "calls",
            callId,
            collectionName
        );

    onSnapshot(
        candidatesRef,
        async (snapshot) => {

            for (
                const change of
                snapshot.docChanges()
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
                    !remoteDescriptionSet
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

                } catch (error) {

                    console.error(
                        "Remote ICE error:",
                        error
                    );

                }

            }

        }
    );

}


// =====================================================
// CALLER
// =====================================================

async function startCallerCall() {

    isCaller = true;

    callId =
        createCallId(
            currentUser.uid,
            receiverId
        );


    callStatus.textContent =
        "Calling...";


    await getLocalMedia();

    createPeerConnection();

    addLocalTracks();


    const callRef =
        doc(
            db,
            "calls",
            callId
        );


    await setDoc(
        callRef,
        {

            callerId:
                currentUser.uid,

            receiverId:
                receiverId,

            type:
                callType,

            status:
                "calling",

            createdAt:
                serverTimestamp()

        },
        {
            merge: true
        }
    );


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


    listenForRemoteCandidates();


    // =================================================
    // LISTEN FOR ANSWER
    // =================================================

    onSnapshot(
        doc(
            db,
            "calls",
            callId,
            "answer",
            "data"
        ),
        async (snapshot) => {

            if (
                !snapshot.exists() ||
                !peerConnection
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

                remoteDescriptionSet =
                    true;

                await flushPendingCandidates();

                callStatus.textContent =
                    "Connected";

            } catch (error) {

                console.error(
                    "Set remote answer error:",
                    error
                );

            }

        }
    );


    // =================================================
    // LISTEN FOR CALL END
    // =================================================

    listenForCallEnd();

}


// =====================================================
// RECEIVER
// =====================================================

async function startReceiverCall() {

    isCaller = false;

    callId =
        createCallId(
            currentUser.uid,
            receiverId
        );


    callStatus.textContent =
        "Connecting...";


    await getLocalMedia();

    createPeerConnection();

    addLocalTracks();


    const callRef =
        doc(
            db,
            "calls",
            callId
        );


    onSnapshot(
        callRef,
        async (snapshot) => {

            if (!snapshot.exists()) {

                return;

            }

            const call =
                snapshot.data();


            if (
                call.status ===
                "ended"
            ) {

                cleanupCall();

                return;

            }

            if (
                call.receiverId !==
                currentUser.uid
            ) {

                return;

            }

        }
    );


    // =================================================
    // WAIT FOR OFFER
    // =================================================

    onSnapshot(
        doc(
            db,
            "calls",
            callId,
            "offer",
            "data"
        ),
        async (snapshot) => {

            if (
                !snapshot.exists() ||
                !peerConnection
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

                remoteDescriptionSet =
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


                await updateDoc(
                    callRef,
                    {

                        status:
                            "connected"

                    }
                );


                callStatus.textContent =
                    "Connected";

            } catch (error) {

                console.error(
                    "Answer creation error:",
                    error
                );

            }

        }
    );


    listenForRemoteCandidates();

    listenForCallEnd();

}


// =====================================================
// CALL END LISTENER
// =====================================================

function listenForCallEnd() {

    if (!callId) {
        return;
    }

    onSnapshot(
        doc(
            db,
            "calls",
            callId
        ),
        (snapshot) => {

            if (!snapshot.exists()) {
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

            const audioTracks =
                localStream
                    .getAudioTracks();

            if (!audioTracks.length) {
                return;
            }

            const enabled =
                audioTracks[0].enabled;

            audioTracks.forEach(
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
                    ? '<i class="fa-solid fa-microphone-slash"></i>'
                    : '<i class="fa-solid fa-microphone"></i>';

        }
    );

}


// =====================================================
// CAMERA ON/OFF
// =====================================================

if (cameraBtn) {

    cameraBtn.addEventListener(
        "click",
        () => {

            if (!localStream) {
                return;
            }

            const videoTracks =
                localStream
                    .getVideoTracks();

            if (!videoTracks.length) {
                return;
            }

            const enabled =
                videoTracks[0].enabled;

            videoTracks.forEach(
                track => {

                    track.enabled =
                        !enabled;

                }
            );


            cameraBtn.classList.toggle(
                "active",
                !enabled
            );


            cameraBtn.innerHTML =
                enabled
                    ? '<i class="fa-solid fa-video-slash"></i>'
                    : '<i class="fa-solid fa-video"></i>';

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


            const videoTrack =
                localStream
                    .getVideoTracks()[0];

            if (!videoTrack) {
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

                                facingMode:
                                    {
                                        ideal:
                                            localCameraFacingMode
                                    }

                            }

                        });


                const newVideoTrack =
                    newStream
                        .getVideoTracks()[0];


                const sender =
                    peerConnection
                        ?.getSenders()
                        .find(
                            s =>
                                s.track &&
                                s.track.kind ===
                                "video"
                        );


                if (sender) {

                    await sender
                        .replaceTrack(
                            newVideoTrack
                        );

                }


                videoTrack.stop();


                localStream.removeTrack(
                    videoTrack
                );

                localStream.addTrack(
                    newVideoTrack
                );


                localVideo.srcObject =
                    localStream;


            } catch (error) {

                console.error(
                    "Switch camera error:",
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


    try {

        if (callId) {

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
                        currentUser?.uid ||
                        null

                }
            );

        }

    } catch (error) {

        console.error(
            "End call update error:",
            error
        );

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

        peerConnection.close();

        peerConnection = null;

    }


    if (localVideo) {

        localVideo.srcObject =
            null;

    }


    if (remoteVideo) {

        remoteVideo.srcObject =
            null;

    }


    callStatus.textContent =
        "Call ended";


    setTimeout(
        () => {

            window.history.back();

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
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser = user;


        if (!receiverId) {

            alert(
                "No receiver specified."
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


        await loadRemoteUser();


        try {

            await getLocalMedia();

        } catch (error) {

            console.error(
                "Media permission error:",
                error
            );

            callStatus.textContent =
                "Camera/microphone permission denied.";

            return;

        }


        /*
         * IMPORTANT:
         *
         * The page is opened as a caller when it
         * contains receiverId.
         *
         * The actual incoming-call flow will later
         * open this page for the receiver after the
         * notification/incoming-call system accepts
         * the call.
         */


        const existingCallId =
            createCallId(
                currentUser.uid,
                receiverId
            );


        const existingCall =
            await getDoc(
                doc(
                    db,
                    "calls",
                    existingCallId
                )
            );


        if (
            existingCall.exists()
        ) {

            const data =
                existingCall.data();


            if (
                data.status ===
                "calling" &&
                data.callerId !==
                currentUser.uid
            ) {

                callId =
                    existingCallId;

                await startReceiverCall();

                return;

            }

        }


        await startCallerCall();

    }
);
