import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    setDoc,
    updateDoc,
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
    params.get("type") || "video";


// =====================================================
// HTML ELEMENTS
// =====================================================

const groupName =
    document.getElementById("groupName");

const groupPhoto =
    document.getElementById("groupPhoto");

const callStatus =
    document.getElementById("callStatus");

const connectionMessage =
    document.getElementById("connectionMessage");

const videoContainer =
    document.getElementById("videoContainer");

const localVideo =
    document.getElementById("localVideo");

const muteBtn =
    document.getElementById("muteBtn");

const muteIcon =
    document.getElementById("muteIcon");

const muteText =
    document.getElementById("muteText");

const cameraBtn =
    document.getElementById("cameraBtn");

const cameraIcon =
    document.getElementById("cameraIcon");

const cameraText =
    document.getElementById("cameraText");

const speakerBtn =
    document.getElementById("speakerBtn");

const leaveBtn =
    document.getElementById("leaveBtn");

const backBtn =
    document.getElementById("backBtn");


// =====================================================
// CURRENT USER
// =====================================================

let currentUser = null;


// =====================================================
// GROUP DATA
// =====================================================

let groupData = null;


// =====================================================
// LOCAL MEDIA
// =====================================================

let localStream = null;


// =====================================================
// STATE
// =====================================================

let isMuted = false;

let cameraEnabled = true;

let speakerEnabled = true;


// =====================================================
// PARTICIPANTS
// =====================================================

const participants =
    new Map();


// =====================================================
// PEER CONNECTIONS
// =====================================================

const peerConnections =
    new Map();


// =====================================================
// REMOTE VIDEOS
// =====================================================

const remoteVideos =
    new Map();


// =====================================================
// LISTENER CLEANUP
// =====================================================

const connectionListeners =
    new Map();


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
// PROFILE CACHE
// =====================================================

const profileCache = {};


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

        name:
            "User",

        photoURL:
            "images/default-avatar.png"

    };

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
// LOAD CALL
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
            "This video call does not exist."
        );

    }

    const callData =
        callSnap.data();

    if (
        callData.groupId !==
        groupId
    ) {

        throw new Error(
            "Invalid group video call."
        );

    }

    if (
        callData.type !==
        "video"
    ) {

        throw new Error(
            "This is not a video call."
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
// GET CAMERA + MICROPHONE
// =====================================================

async function getCameraAndMicrophone() {

    try {

        localStream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode:
                            "user"

                    },

                    audio: {

                        echoCancellation:
                            true,

                        noiseSuppression:
                            true,

                        autoGainControl:
                            true

                    }

                });


        localVideo.srcObject =
            localStream;

        localVideo.muted =
            true;

        await localVideo.play()
            .catch(
                () => {}
            );


        return true;

    } catch (error) {

        console.error(
            "Camera/microphone error:",
            error
        );

        alert(
            "Camera and microphone permission are required for the video call."
        );

        return false;

    }

}


// =====================================================
// JOIN CALL
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
                true,

            online:
                true

        },
        {
            merge: true
        }
    );

}


// =====================================================
// CREATE REMOTE VIDEO
// =====================================================

async function createRemoteVideo(
    remoteUid,
    stream
) {

    let video =
        remoteVideos.get(
            remoteUid
        );

    if (!video) {

        const profile =
            await getUserProfile(
                remoteUid
            );

        const videoBox =
            document.createElement(
                "div"
            );

        videoBox.className =
            "video-box";

        videoBox.id =
            `remote-video-box-${remoteUid}`;


        video =
            document.createElement(
                "video"
            );

        video.autoplay =
            true;

        video.playsInline =
            true;

        video.dataset.uid =
            remoteUid;


        const name =
            document.createElement(
                "div"
            );

        name.className =
            "video-name";

        name.textContent =
            profile.name;


        videoBox.appendChild(
            video
        );

        videoBox.appendChild(
            name
        );


        videoContainer.appendChild(
            videoBox
        );


        remoteVideos.set(
            remoteUid,
            video
        );

    }


    video.srcObject =
        stream;

    video.muted =
        !speakerEnabled;

    video.play()
        .catch(
            error => {

                console.warn(
                    "Remote video autoplay blocked:",
                    error
                );

            }
        );

}


// =====================================================
// REMOVE REMOTE VIDEO
// =====================================================

function removeRemoteVideo(
    remoteUid
) {

    const video =
        remoteVideos.get(
            remoteUid
        );

    if (video) {

        video.srcObject =
            null;

        const box =
            document.getElementById(
                `remote-video-box-${remoteUid}`
            );

        if (box) {

            box.remove();

        }

    }

    remoteVideos.delete(
        remoteUid
    );

}


// =====================================================
// CREATE PEER CONNECTION
// =====================================================

function createPeerConnection(
    remoteUid
) {

    console.log(
        "Creating peer connection:",
        remoteUid
    );


    const peer =
        new RTCPeerConnection(
            rtcConfiguration
        );


    peerConnections.set(
        remoteUid,
        peer
    );


    // =====================================
    // ADD LOCAL TRACKS
    // =====================================

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


    // =====================================
    // REMOTE TRACK
    // =====================================

    peer.ontrack =
        event => {

            console.log(
                "Remote track received:",
                remoteUid
            );

            const stream =
                event.streams[0];

            if (!stream) {

                return;

            }

            createRemoteVideo(
                remoteUid,
                stream
            );

        };


    // =====================================
    // ICE CANDIDATE
    // =====================================

    peer.onicecandidate =
        async event => {

            if (
                !event.candidate
            ) {

                return;

            }

            try {

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

            } catch (error) {

                console.error(
                    "Saving ICE candidate error:",
                    error
                );

            }

        };


    // =====================================
    // CONNECTION STATE
    // =====================================

    peer.onconnectionstatechange =
        () => {

            console.log(
                "Peer connection:",
                remoteUid,
                peer.connectionState
            );


            if (
                peer.connectionState ===
                "connected"
            ) {

                connectionMessage.textContent =
                    "Video call connected";

            }


            if (
                peer.connectionState ===
                "failed"
            ) {

                console.warn(
                    "Peer connection failed:",
                    remoteUid
                );

            }


            if (
                peer.connectionState ===
                "disconnected"
            ) {

                console.warn(
                    "Peer disconnected:",
                    remoteUid
                );

            }


            if (
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
// CREATE OFFER
// =====================================================

async function createOffer(
    remoteUid,
    peer
) {

    console.log(
        "Creating offer for:",
        remoteUid
    );


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


    console.log(
        "Offer saved:",
        remoteUid
    );

}


// =====================================================
// LISTEN FOR CONNECTION SIGNALING
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


    // =====================================
    // CONNECTION DOCUMENT
    // =====================================

    const unsubscribeConnection =
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

                    // =================================
                    // RECEIVE OFFER
                    // =================================

                    if (
                        data.offer &&
                        data.receiver ===
                            currentUser.uid &&
                        !peer.currentRemoteDescription
                    ) {

                        console.log(
                            "Offer received from:",
                            remoteUid
                        );


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


                        console.log(
                            "Answer sent to:",
                            remoteUid
                        );

                    }


                    // =================================
                    // RECEIVE ANSWER
                    // =================================

                    if (
                        data.answer &&
                        data.caller ===
                            currentUser.uid &&
                        !peer.currentRemoteDescription
                    ) {

                        console.log(
                            "Answer received from:",
                            remoteUid
                        );


                        await peer.setRemoteDescription(
                            new RTCSessionDescription(
                                data.answer
                            )
                        );

                    }

                } catch (error) {

                    console.error(
                        "Signaling error:",
                        remoteUid,
                        error
                    );

                }

            }
        );


    connectionListeners.set(
        remoteUid,
        unsubscribeConnection
    );


    // =====================================
    // REMOTE ICE CANDIDATES
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
                const change
                of snapshot.docChanges()
            ) {

                if (
                    change.type !==
                    "added"
                ) {

                    continue;

                }


                const data =
                    change.doc.data();


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


                    console.log(
                        "ICE candidate added:",
                        remoteUid
                    );

                } catch (error) {

                    console.error(
                        "ICE candidate error:",
                        remoteUid,
                        error
                    );

                }

            }

        }
    );

}


// =====================================================
// ENSURE CONNECTION
// =====================================================

async function ensurePeerConnection(
    remoteUid
) {

    if (
        remoteUid ===
        currentUser.uid
    ) {

        return;

    }


    if (
        peerConnections.has(
            remoteUid
        )
    ) {

        return;

    }


    console.log(
        "Connecting to participant:",
        remoteUid
    );


    const peer =
        createPeerConnection(
            remoteUid
        );


    // =====================================
    // LISTEN FIRST
    // =====================================

    listenForConnection(
        remoteUid,
        peer
    );


    // =====================================
    // ONLY ONE SIDE CREATES OFFER
    // =====================================

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
                remoteUid,
                error
            );

        }

    }

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
        async snapshot => {

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


                activeUIDs.add(
                    uid
                );


                participants.set(
                    uid,
                    data
                );

            }


            // =================================
            // REMOVE LEFT PARTICIPANTS
            // =================================

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

                    closePeerConnection(
                        uid
                    );

                    removeRemoteVideo(
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


            if (
                count > 1
            ) {

                connectionMessage.textContent =
                    "Connecting to participants...";

            } else {

                connectionMessage.textContent =
                    "Waiting for other participants...";

            }


            // =================================
            // CONNECT TO EVERY OTHER MEMBER
            // =================================

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


    const unsubscribe =
        connectionListeners.get(
            remoteUid
        );


    if (unsubscribe) {

        unsubscribe();

    }


    connectionListeners.delete(
        remoteUid
    );

}


// =====================================================
// MUTE
// =====================================================

async function toggleMute() {

    if (!localStream) {

        return;

    }


    isMuted =
        !isMuted;


    localStream
        .getAudioTracks()
        .forEach(
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


    try {

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

    } catch (error) {

        console.error(
            "Mute update error:",
            error
        );

    }

}


// =====================================================
// CAMERA
// =====================================================

async function toggleCamera() {

    if (!localStream) {

        return;

    }


    cameraEnabled =
        !cameraEnabled;


    localStream
        .getVideoTracks()
        .forEach(
            track => {

                track.enabled =
                    cameraEnabled;

            }
        );


    cameraIcon.textContent =
        cameraEnabled
            ? "📹"
            : "🚫";


    cameraText.textContent =
        cameraEnabled
            ? "Camera"
            : "Camera Off";


    try {

        await updateDoc(
            doc(
                db,
                "groupCalls",
                callId,
                "participants",
                currentUser.uid
            ),
            {

                cameraOn:
                    cameraEnabled

            }
        );

    } catch (error) {

        console.error(
            "Camera update error:",
            error
        );

    }

}


// =====================================================
// SPEAKER
// =====================================================

function toggleSpeaker() {

    speakerEnabled =
        !speakerEnabled;


    remoteVideos.forEach(
        video => {

            video.muted =
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

        // =====================================
        // MARK USER OFFLINE
        // =====================================

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


        // =====================================
        // CLOSE PEERS
        // =====================================

        peerConnections.forEach(
            peer => {

                peer.close();

            }
        );


        peerConnections.clear();


        // =====================================
        // STOP LOCAL MEDIA
        // =====================================

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
            "Leave video call error:",
            error
        );

    }


    window.location.href =
        `group-chat.html?groupId=${encodeURIComponent(groupId)}`;

}


// =====================================================
// BUTTON EVENTS
// =====================================================

if (muteBtn) {

    muteBtn.addEventListener(
        "click",
        toggleMute
    );

}


if (cameraBtn) {

    cameraBtn.addEventListener(
        "click",
        toggleCamera
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
                    "Leave this video call?"
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
// PAGE CLOSING
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
                "Invalid group video call."
            );

            return;

        }


        if (
            callType !==
            "video"
        ) {

            alert(
                "Invalid call type."
            );

            return;

        }


        try {

            connectionMessage.textContent =
                "Loading video call...";


            // =================================
            // LOAD GROUP
            // =================================

            await loadGroup();


            // =================================
            // LOAD CALL
            // =================================

            await loadCall();


            // =================================
            // CAMERA + MICROPHONE
            // =================================

            const mediaReady =
                await getCameraAndMicrophone();


            if (!mediaReady) {

                return;

            }


            // =================================
            // JOIN
            // =================================

            await joinCall();


            // =================================
            // LISTEN
            // =================================

            listenForParticipants();


            connectionMessage.textContent =
                "Waiting for other participants...";


        } catch (error) {

            console.error(
                "Group video call startup error:",
                error
            );


            alert(
                error.message ||
                "Unable to join group video call."
            );


            window.location.href =
                `group-chat.html?groupId=${encodeURIComponent(groupId)}`;

        }

    }
);
