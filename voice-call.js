import { auth, db } from "./firebase.js";

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
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


// =====================================================
// URL
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

let callId = null;

let peerConnection = null;

let localStream = null;

let remoteStream = null;

let remoteAudio = null;

let isCaller = false;

let callEnded = false;

let remoteDescriptionReady = false;

let pendingCandidates = [];

let unsubscribeCall = null;

let unsubscribeAnswer = null;

let unsubscribeOffer = null;

let unsubscribeRemoteCandidates = null;


// =====================================================
// WEBRTC
// =====================================================

const rtcConfiguration = {

    iceServers: [

        {
            urls: "stun:stun.l.google.com:19302"
        },

        {
            urls: "stun:stun1.l.google.com:19302"
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
            "Profile error:",
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
// DISPLAY USER
// =====================================================

async function loadRemoteUser() {

    const user =
        await loadUser(
            receiverId
        );

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

    try {

        localStream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    audio: true,

                    video: false

                });

        return localStream;

    } catch (error) {

        console.error(
            "❌ Microphone error:",
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


    peerConnection =
        new RTCPeerConnection(
            rtcConfiguration
        );


    remoteStream =
        new MediaStream();


    // =================================================
    // REMOTE AUDIO
    // =================================================

    remoteAudio =
        document.getElementById(
            "remoteAudio"
        );


    if (!remoteAudio) {

        remoteAudio =
            document.createElement(
                "audio"
            );

        remoteAudio.id =
            "remoteAudio";

        remoteAudio.autoplay =
            true;

        remoteAudio.playsInline =
            true;

        document.body.appendChild(
            remoteAudio
        );

    }


    remoteAudio.autoplay =
        true;

    remoteAudio.playsInline =
        true;

    remoteAudio.srcObject =
        remoteStream;


    // =================================================
    // REMOTE TRACK
    // =================================================

    peerConnection.ontrack =
        event => {

            console.log(
                "🔊 REMOTE AUDIO RECEIVED"
            );


            for (
                const track
                of event.streams[0]?.getTracks() || []
            ) {

                if (
                    !remoteStream
                        .getTracks()
                        .some(
                            existing =>
                                existing.id ===
                                track.id
                        )
                ) {

                    remoteStream.addTrack(
                        track
                    );

                }

            }


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
                            "Audio autoplay:",
                            error
                        );

                    }
                );


            setCallStatus(
                "Connected"
            );

        };


    // =================================================
    // LOCAL ICE
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
                    "🧊 ICE saved:",
                    collectionName
                );

            } catch (error) {

                console.error(
                    "❌ ICE save error:",
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
                "🔗 CONNECTION:",
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

        };


    // =================================================
    // ICE STATE
    // =================================================

    peerConnection
        .oniceconnectionstatechange =
        () => {

            console.log(
                "🧊 ICE STATE:",
                peerConnection
                    ?.iceConnectionState
            );

        };


    // =================================================
    // ADD MICROPHONE
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
// LISTEN REMOTE ICE
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
// FLUSH PENDING ICE
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


                if (
                    data.status ===
                    "connected"
                ) {

                    setCallStatus(
                        "Connected"
                    );

                }


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
// CALLER
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


    // IMPORTANT:
    // Get microphone BEFORE creating peer connection

    await getMicrophone();


    createPeerConnection();


    // IMPORTANT:
    // Create call document BEFORE creating offer

    await createCall();


    listenForRemoteCandidates();

    listenForCallStatus();


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
        "📤 OFFER SENT:",
        callId
    );


    // =================================================
    // WAIT FOR ANSWER
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
                        "📥 ANSWER RECEIVED"
                    );


                    setCallStatus(
                        "Connected"
                    );

                } catch (error) {

                    console.error(
                        "❌ ANSWER ERROR:",
                        error
                    );

                }

            }
        );

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


    if (!callId) {

        console.error(
            "❌ No call ID"
        );

        return;

    }


    console.log(
        "📲 RECEIVING CALL:",
        callId
    );


    setCallStatus(
        "Connecting..."
    );


    await getMicrophone();


    createPeerConnection();


    listenForRemoteCandidates();

    listenForCallStatus();


    // =================================================
    // LISTEN FOR OFFER
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


                    setCallStatus(
                        "Connected"
                    );

                } catch (error) {

                    console.error(
                        "❌ RECEIVER ERROR:",
                        error
                    );

                    setCallStatus(
                        "Call connection failed"
                    );

                }

            }
        );

}


// =====================================================
// FIND INCOMING CALL
// =====================================================

async function findIncomingCall() {

    const callsQuery =
        query(
            collection(
                db,
                "calls"
            ),
            where(
                "receiverId",
                "==",
                currentUser.uid
            ),
            where(
                "callerId",
                "==",
                receiverId
            ),
            where(
                "type",
                "==",
                "voice"
            ),
            where(
                "status",
                "==",
                "ringing"
            )
        );


    const snapshot =
        await getDocs(
            callsQuery
        );


    if (
        snapshot.empty
    ) {

        return null;

    }


    return snapshot.docs[0].id;

}


// =====================================================
// END CALL
// =====================================================

async function endCall() {

    console.log(
        "📞 END CALL BUTTON PRESSED"
    );


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


            console.log(
                "📞 CALL MARKED ENDED"
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

    if (
        callEnded === false
    ) {

        callEnded = true;

    }


    // =================================================
    // LISTENERS
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


    if (unsubscribeOffer) {

        unsubscribeOffer();

        unsubscribeOffer =
            null;

    }


    if (unsubscribeRemoteCandidates) {

        unsubscribeRemoteCandidates();

        unsubscribeRemoteCandidates =
            null;

    }


    // =================================================
    // MICROPHONE
    // =================================================

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

        localStream = null;

    }


    // =================================================
    // REMOTE AUDIO
    // =================================================

    if (remoteAudio) {

        remoteAudio.pause();

        remoteAudio.srcObject =
            null;

        remoteAudio =
            null;

    }


    if (remoteStream) {

        remoteStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

        remoteStream = null;

    }


    // =================================================
    // PEER CONNECTION
    // =================================================

    if (peerConnection) {

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
    // RETURN
    // =================================================

    if (goBack) {

        setTimeout(
            () => {

                window.location.href =
                    "chats.html";

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

            await loadRemoteUser();


            // =================================================
            // CHECK FOR INCOMING CALL
            // =================================================

            const incomingCall =
                await findIncomingCall();


            if (incomingCall) {

                callId =
                    incomingCall;


                console.log(
                    "📲 INCOMING VOICE CALL:",
                    callId
                );


                await startReceiverCall();

            } else {

                console.log(
                    "📞 OUTGOING VOICE CALL"
                );


                await startCallerCall();

            }

        } catch (error) {

            console.error(
                "❌ VOICE CALL START ERROR:",
                error
            );


            setCallStatus(
                "Unable to start call"
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
                    track =>
                        track.stop()
                );

        }


        if (peerConnection) {

            peerConnection.close();

        }

    }
);
