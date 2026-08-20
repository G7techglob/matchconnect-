import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    deleteDoc,
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

const groupCallName =
    document.getElementById("groupCallName");

const participantCount =
    document.getElementById("participantCount");

const participantsGrid =
    document.getElementById("participantsGrid");

const groupMuteBtn =
    document.getElementById("groupMuteBtn");

const groupCameraBtn =
    document.getElementById("groupCameraBtn");

const groupSwitchCameraBtn =
    document.getElementById("groupSwitchCameraBtn");

const groupEndCallBtn =
    document.getElementById("groupEndCallBtn");


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
    params.get("type") === "voice"
        ? "voice"
        : "video";


// =====================================================
// CURRENT USER
// =====================================================

let currentUser = null;

let groupData = null;

let localStream = null;

let callEnded = false;

let isHost = false;

let localCameraFacingMode = "user";


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
// REMOTE STREAMS
// =====================================================

const remoteStreams =
    new Map();


// =====================================================
// ICE CANDIDATE QUEUES
// =====================================================

const pendingCandidates =
    new Map();


// =====================================================
// REMOTE DESCRIPTIONS
// =====================================================

const remoteDescriptionReady =
    new Map();


// =====================================================
// FIRESTORE LISTENERS
// =====================================================

const unsubscribeFunctions =
    [];


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
// INITIAL MODE
// =====================================================

if (callType === "voice") {

    document.body.classList.add(
        "voice-mode"
    );

} else {

    document.body.classList.remove(
        "voice-mode"
    );

}


// =====================================================
// CREATE UNIQUE CONNECTION ID
// =====================================================

function createConnectionId(
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
            "Profile error:",
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


    groupCallName.textContent =
        groupData.name ||
        "Group Call";


    isHost =
        groupData.ownerId ===
        currentUser.uid;

}


// =====================================================
// GET LOCAL MEDIA
// =====================================================

async function getLocalMedia() {

    if (localStream) {

        return localStream;

    }


    localStream =
        await navigator
            .mediaDevices
            .getUserMedia({

                audio: true,

                video:
                    callType === "video"

            });


    return localStream;

}


// =====================================================
// CREATE LOCAL TILE
// =====================================================

async function createLocalTile() {

    const profile =
        await getUserProfile(
            currentUser.uid
        );


    createParticipantTile(
        currentUser.uid,
        profile,
        localStream,
        true
    );

}


// =====================================================
// CREATE PARTICIPANT TILE
// =====================================================

function createParticipantTile(
    uid,
    profile,
    stream,
    isLocal = false
) {

    let tile =
        document.getElementById(
            `participant-${uid}`
        );


    if (tile) {

        const video =
            tile.querySelector(
                "video"
            );

        const avatar =
            tile.querySelector(
                ".participant-avatar"
            );


        if (
            stream &&
            callType === "video"
        ) {

            video.srcObject =
                stream;

            video.play()
                .catch(() => {});

            if (avatar) {

                avatar.style.display =
                    "none";

            }

        }

        return;

    }


    tile =
        document.createElement(
            "div"
        );

    tile.className =
        "participant-tile";

    tile.id =
        `participant-${uid}`;


    // =================================================
    // VIDEO
    // =================================================

    const video =
        document.createElement(
            "video"
        );

    video.autoplay =
        true;

    video.playsInline =
        true;

    video.muted =
        isLocal;

    video.setAttribute(
        "playsinline",
        ""
    );


    // =================================================
    // VOICE AVATAR
    // =================================================

    const voiceContainer =
        document.createElement(
            "div"
        );

    voiceContainer.className =
        "voice-participant";


    const avatar =
        document.createElement(
            "img"
        );

    avatar.className =
        "participant-avatar";

    avatar.src =
        profile.photoURL ||
        "images/default-avatar.png";


    voiceContainer.appendChild(
        avatar
    );


    // =================================================
    // NAME
    // =================================================

    const name =
        document.createElement(
            "div"
        );

    name.className =
        "participant-name";

    name.textContent =
        isLocal
            ? `${profile.name} (You)`
            : profile.name;


    // =================================================
    // MIC STATUS
    // =================================================

    const mic =
        document.createElement(
            "div"
        );

    mic.className =
        "participant-mic";

    mic.innerHTML =
        '<i class="fa-solid fa-microphone"></i>';


    tile.appendChild(
        video
    );

    tile.appendChild(
        voiceContainer
    );

    tile.appendChild(
        name
    );

    tile.appendChild(
        mic
    );


    participantsGrid.appendChild(
        tile
    );


    if (
        stream &&
        callType === "video"
    ) {

        video.srcObject =
            stream;

        video.play()
            .catch(() => {});

        voiceContainer.style.display =
            "none";

    }


    if (
        isLocal &&
        callType === "video"
    ) {

        video.muted =
            true;

    }


    if (callType === "video") {

        video.style.display =
            "block";

    }


    updateParticipantCount();

}


// =====================================================
// REMOVE PARTICIPANT TILE
// =====================================================

function removeParticipantTile(uid) {

    const tile =
        document.getElementById(
            `participant-${uid}`
        );

    if (tile) {

        tile.remove();

    }


    updateParticipantCount();

}


// =====================================================
// PARTICIPANT COUNT
// =====================================================

function updateParticipantCount() {

    const count =
        participants.size;


    participantCount.textContent =
        count === 1
            ? "1 participant"
            : `${count} participants`;

}


// =====================================================
// CREATE PEER CONNECTION
// =====================================================

async function createPeerConnection(
    remoteUid
) {

    if (
        peerConnections.has(
            remoteUid
        )
    ) {

        return peerConnections.get(
            remoteUid
        );

    }


    const connectionId =
        createConnectionId(
            currentUser.uid,
            remoteUid
        );


    const connection =
        new RTCPeerConnection(
            rtcConfiguration
        );


    peerConnections.set(
        remoteUid,
        connection
    );


    pendingCandidates.set(
        remoteUid,
        []
    );


    remoteDescriptionReady.set(
        remoteUid,
        false
    );


    // =================================================
    // LOCAL TRACKS
    // =================================================

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                track => {

                    connection.addTrack(
                        track,
                        localStream
                    );

                }
            );

    }


    // =================================================
    // REMOTE STREAM
    // =================================================

    const remoteStream =
        new MediaStream();


    remoteStreams.set(
        remoteUid,
        remoteStream
    );


    connection.addEventListener(
        "track",
        async (event) => {

            event.streams[0]
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


            const profile =
                await getUserProfile(
                    remoteUid
                );


            createParticipantTile(
                remoteUid,
                profile,
                remoteStream,
                false
            );

        }
    );


    // =================================================
    // ICE CANDIDATES
    // =================================================

    connection.addEventListener(
        "icecandidate",
        async (event) => {

            if (!event.candidate) {

                return;

            }


            try {

                const candidatesRef =
                    collection(
                        db,
                        "groupCalls",
                        callId,
                        "connections",
                        connectionId,
                        currentUser.uid ===
                            getConnectionInitiator(
                                currentUser.uid,
                                remoteUid
                            )
                            ? "callerCandidates"
                            : "receiverCandidates"
                    );


                await addDoc(
                    candidatesRef,
                    event.candidate.toJSON()
                );

            } catch (error) {

                console.error(
                    "Group ICE candidate error:",
                    error
                );

            }

        }
    );


    // =================================================
    // CONNECTION STATE
    // =================================================

    connection.addEventListener(
        "connectionstatechange",
        () => {

            const state =
                connection.connectionState;


            console.log(
                "Group connection:",
                remoteUid,
                state
            );


            if (
                state === "failed" ||
                state === "closed"
            ) {

                removePeerConnection(
                    remoteUid
                );

            }

        }
    );


    // =================================================
    // LISTEN FOR REMOTE CANDIDATES
    // =================================================

    listenForConnectionCandidates(
        remoteUid,
        connectionId,
        connection
    );


    return connection;

}


// =====================================================
// CONNECTION INITIATOR
// =====================================================

function getConnectionInitiator(
    uid1,
    uid2
) {

    return [

        uid1,
        uid2

    ]
        .sort()[0];

}


// =====================================================
// LISTEN FOR CANDIDATES
// =====================================================

function listenForConnectionCandidates(
    remoteUid,
    connectionId,
    connection
) {

    const initiator =
        getConnectionInitiator(
            currentUser.uid,
            remoteUid
        );


    const collectionName =
        currentUser.uid === initiator
            ? "receiverCandidates"
            : "callerCandidates";


    const candidatesRef =
        collection(
            db,
            "groupCalls",
            callId,
            "connections",
            connectionId,
            collectionName
        );


    const unsubscribe =
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
                        !remoteDescriptionReady
                            .get(remoteUid)
                    ) {

                        pendingCandidates
                            .get(remoteUid)
                            .push(candidate);

                        continue;

                    }


                    try {

                        await connection
                            .addIceCandidate(
                                new RTCIceCandidate(
                                    candidate
                                )
                            );

                    } catch (error) {

                        console.error(
                            "Add group candidate error:",
                            error
                        );

                    }

                }

            }
        );


    unsubscribeFunctions.push(
        unsubscribe
    );

}


// =====================================================
// FLUSH CANDIDATES
// =====================================================

async function flushCandidates(
    remoteUid
) {

    const connection =
        peerConnections.get(
            remoteUid
        );


    if (!connection) {
        return;
    }


    const queue =
        pendingCandidates.get(
            remoteUid
        ) || [];


    while (
        queue.length > 0
    ) {

        const candidate =
            queue.shift();


        try {

            await connection
                .addIceCandidate(
                    new RTCIceCandidate(
                        candidate
                    )
                );

        } catch (error) {

            console.error(
                "Flush candidate error:",
                error
            );

        }

    }

}


// =====================================================
// CREATE OFFER
// =====================================================

async function createOfferForParticipant(
    remoteUid
) {

    const connection =
        await createPeerConnection(
            remoteUid
        );


    const connectionId =
        createConnectionId(
            currentUser.uid,
            remoteUid
        );


    const offer =
        await connection
            .createOffer();


    await connection
        .setLocalDescription(
            offer
        );


    await setDoc(
        doc(
            db,
            "groupCalls",
            callId,
            "connections",
            connectionId,
            "offer",
            "data"
        ),
        {

            type:
                offer.type,

            sdp:
                offer.sdp,

            from:
                currentUser.uid,

            to:
                remoteUid

        }
    );


    listenForAnswer(
        remoteUid,
        connectionId,
        connection
    );

}


// =====================================================
// LISTEN FOR ANSWER
// =====================================================

function listenForAnswer(
    remoteUid,
    connectionId,
    connection
) {

    const unsubscribe =
        onSnapshot(
            doc(
                db,
                "groupCalls",
                callId,
                "connections",
                connectionId,
                "answer",
                "data"
            ),
            async (snapshot) => {

                if (
                    !snapshot.exists()
                ) {

                    return;

                }


                if (
                    connection
                        .currentRemoteDescription
                ) {

                    return;

                }


                const answer =
                    snapshot.data();


                try {

                    await connection
                        .setRemoteDescription(
                            new RTCSessionDescription(
                                answer
                            )
                        );


                    remoteDescriptionReady
                        .set(
                            remoteUid,
                            true
                        );


                    await flushCandidates(
                        remoteUid
                    );

                } catch (error) {

                    console.error(
                        "Group answer error:",
                        error
                    );

                }

            }
        );


    unsubscribeFunctions.push(
        unsubscribe
    );

}


// =====================================================
// LISTEN FOR OFFER
// =====================================================

function listenForOffers() {

    const myUid =
        currentUser.uid;


    const unsubscribe =
        onSnapshot(
            collection(
                db,
                "groupCalls",
                callId,
                "connections"
            ),
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


                    const connectionId =
                        change.doc.id;


                    if (
                        !connectionId.includes(
                            myUid
                        )
                    ) {

                        continue;

                    }


                    const parts =
                        connectionId.split("_");


                    const remoteUid =
                        parts.find(
                            uid =>
                                uid !==
                                myUid
                        );


                    if (!remoteUid) {
                        continue;
                    }


                    const offerSnap =
                        await getDoc(
                            doc(
                                db,
                                "groupCalls",
                                callId,
                                "connections",
                                connectionId,
                                "offer",
                                "data"
                            )
                        );


                    if (
                        !offerSnap.exists()
                    ) {

                        continue;

                    }


                    const connection =
                        await createPeerConnection(
                            remoteUid
                        );


                    if (
                        connection
                            .currentRemoteDescription
                    ) {

                        continue;

                    }


                    const offer =
                        offerSnap.data();


                    try {

                        await connection
                            .setRemoteDescription(
                                new RTCSessionDescription(
                                    offer
                                )
                            );


                        remoteDescriptionReady
                            .set(
                                remoteUid,
                                true
                            );


                        await flushCandidates(
                            remoteUid
                        );


                        const answer =
                            await connection
                                .createAnswer();


                        await connection
                            .setLocalDescription(
                                answer
                            );


                        await setDoc(
                            doc(
                                db,
                                "groupCalls",
                                callId,
                                "connections",
                                connectionId,
                                "answer",
                                "data"
                            ),
                            {

                                type:
                                    answer.type,

                                sdp:
                                    answer.sdp,

                                from:
                                    myUid,

                                to:
                                    remoteUid

                            }
                        );


                    } catch (error) {

                        console.error(
                            "Group offer handling error:",
                            error
                        );

                    }

                }

            }
        );


    unsubscribeFunctions.push(
        unsubscribe
    );

}


// =====================================================
// PARTICIPANT LISTENER
// =====================================================

function listenForParticipants() {

    const participantsRef =
        collection(
            db,
            "groupCalls",
            callId,
            "participants"
        );


    const unsubscribe =
        onSnapshot(
            participantsRef,
            async (snapshot) => {

                const activeIds =
                    new Set();


                for (
                    const participantDoc of
                    snapshot.docs
                ) {

                    const uid =
                        participantDoc.id;


                    const data =
                        participantDoc.data();


                    activeIds.add(
                        uid
                    );


                    if (
                        !participants.has(
                            uid
                        )
                    ) {

                        participants.set(
                            uid,
                            data
                        );


                        const profile =
                            await getUserProfile(
                                uid
                            );


                        createParticipantTile(
                            uid,
                            profile,
                            uid ===
                                currentUser.uid
                                ? localStream
                                : remoteStreams.get(
                                    uid
                                ),
                            uid ===
                                currentUser.uid
                        );


                        updateParticipantCount();


                        if (
                            uid !==
                            currentUser.uid
                        ) {

                            const initiator =
                                getConnectionInitiator(
                                    currentUser.uid,
                                    uid
                                );


                            if (
                                currentUser.uid ===
                                initiator
                            ) {

                                await createOfferForParticipant(
                                    uid
                                );

                            }

                        }

                    }

                }


                // =================================================
                // REMOVE LEFT PARTICIPANTS
                // =================================================

                for (
                    const uid of
                    participants.keys()
                ) {

                    if (
                        !activeIds.has(
                            uid
                        )
                    ) {

                        participants.delete(
                            uid
                        );


                        removePeerConnection(
                            uid
                        );


                        removeParticipantTile(
                            uid
                        );

                    }

                }


                updateParticipantCount();

            }
        );


    unsubscribeFunctions.push(
        unsubscribe
    );

}

// =====================================================
// LISTEN FOR GROUP CALL STATUS
// =====================================================

function listenForGroupCall() {

    if (!groupId) {
        return;
    }


    const callRef =
        doc(
            db,
            "groupCalls",
            callId
        );


    const unsubscribe =
        onSnapshot(
            callRef,
            (snapshot) => {

                if (!snapshot.exists()) {

                    return;

                }


                const call =
                    snapshot.data();


                // =====================================
                // CALL ENDED
                // =====================================

                if (
                    call.status ===
                    "ended"
                ) {

                    if (
                        !callEnded
                    ) {

                        alert(
                            "The group call has ended."
                        );

                        leaveGroupCall();

                    }

                    return;

                }


                // =====================================
                // CALL ACTIVE
                // =====================================

                if (
                    call.status ===
                    "active"
                ) {

                    console.log(
                        "Group call is active:",
                        callId
                    );

                }

            },
            (error) => {

                console.error(
                    "Group call listener error:",
                    error
                );

            }
        );


    unsubscribeFunctions.push(
        unsubscribe
    );

}

// =====================================================
// JOIN GROUP CALL
// =====================================================

async function joinGroupCall() {

    const callRef =
    doc(
        db,
        "groupCalls",
        callId
    );


const callSnap =
    await getDoc(
        callRef
    );


if (!callSnap.exists()) {

    throw new Error(
        "This call session no longer exists."
    );

}


const existingCall =
    callSnap.data();


if (
    existingCall.groupId !==
    groupId
) {

    throw new Error(
        "This call does not belong to this group."
    );


}


if (
    existingCall.type !==
    callType
) {

    throw new Error(
        "Call type does not match."
    );

}


    await setDoc(
        doc(
            db,
            "groupCalls",
            callId,
            "participants",
            currentUser.uid
        ),
        {

            uid:
                currentUser.uid,

            joinedAt:
                serverTimestamp(),

            muted:
                false,

            cameraOn:
                callType === "video"

        }
    );


    participants.set(
        currentUser.uid,
        {

            uid:
                currentUser.uid

        }
    );


    await createLocalTile();


    listenForParticipants();

    listenForOffers();

    listenForGroupCall();

}


// =====================================================
// REMOVE PEER CONNECTION
// =====================================================

function removePeerConnection(
    remoteUid
) {

    const connection =
        peerConnections.get(
            remoteUid
        );


    if (connection) {

        try {

            connection.close();

        } catch (error) {}

    }


    peerConnections.delete(
        remoteUid
    );


    remoteStreams.delete(
        remoteUid
    );


    pendingCandidates.delete(
        remoteUid
    );


    remoteDescriptionReady.delete(
        remoteUid
    );

}


// =====================================================
// MUTE
// =====================================================

if (groupMuteBtn) {

    groupMuteBtn.addEventListener(
        "click",
        async () => {

            if (!localStream) {
                return;
            }


            const audioTracks =
                localStream
                    .getAudioTracks();


            if (!audioTracks.length) {
                return;
            }


            const currentlyEnabled =
                audioTracks[0].enabled;


            audioTracks.forEach(
                track => {

                    track.enabled =
                        !currentlyEnabled;

                }
            );


            groupMuteBtn.classList.toggle(
                "active",
                currentlyEnabled
            );


            groupMuteBtn.innerHTML =
                currentlyEnabled
                    ? '<i class="fa-solid fa-microphone-slash"></i>'
                    : '<i class="fa-solid fa-microphone"></i>';


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
                            currentlyEnabled

                    }
                );

            } catch (error) {

                console.error(
                    "Mute state update error:",
                    error
                );

            }

        }
    );

}


// =====================================================
// CAMERA
// =====================================================

if (groupCameraBtn) {

    groupCameraBtn.addEventListener(
        "click",
        async () => {

            if (!localStream) {
                return;
            }


            const videoTracks =
                localStream
                    .getVideoTracks();


            if (!videoTracks.length) {
                return;
            }


            const currentlyEnabled =
                videoTracks[0].enabled;


            videoTracks.forEach(
                track => {

                    track.enabled =
                        !currentlyEnabled;

                }
            );


            groupCameraBtn.classList.toggle(
                "active",
                !currentlyEnabled
            );


            groupCameraBtn.innerHTML =
                currentlyEnabled
                    ? '<i class="fa-solid fa-video-slash"></i>'
                    : '<i class="fa-solid fa-video"></i>';


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
                            !currentlyEnabled

                    }
                );

            } catch (error) {

                console.error(
                    "Camera state update error:",
                    error
                );

            }

        }
    );

}


// =====================================================
// SWITCH CAMERA
// =====================================================

if (groupSwitchCameraBtn) {

    groupSwitchCameraBtn.addEventListener(
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


            const currentTrack =
                localStream
                    .getVideoTracks()[0];


            if (!currentTrack) {
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


                const newTrack =
                    newStream
                        .getVideoTracks()[0];


                for (
                    const connection
                    of peerConnections.values()
                ) {

                    const sender =
                        connection
                            .getSenders()
                            .find(
                                s =>
                                    s.track &&
                                    s.track.kind ===
                                    "video"
                            );


                    if (sender) {

                        await sender
                            .replaceTrack(
                                newTrack
                            );

                    }

                }


                currentTrack.stop();


                localStream.removeTrack(
                    currentTrack
                );


                localStream.addTrack(
                    newTrack
                );


                const localTile =
                    document.getElementById(
                        `participant-${currentUser.uid}`
                    );


                if (localTile) {

                    const video =
                        localTile
                            .querySelector(
                                "video"
                            );


                    if (video) {

                        video.srcObject =
                            localStream;

                    }

                }

            } catch (error) {

                console.error(
                    "Group switch camera error:",
                    error
                );

            }

        }
    );

}


// =====================================================
// LEAVE GROUP CALL
// =====================================================

async function leaveGroupCall() {

    if (callEnded) {
        return;
    }


    callEnded = true;


    try {

        await deleteDoc(
            doc(
                db,
                "groupCalls",
                callId,
                "participants",
                currentUser.uid
            )
        );

    } catch (error) {

        console.error(
            "Remove participant error:",
            error
        );

    }


    // =================================================
    // CLOSE CONNECTIONS
    // =================================================

    for (
        const remoteUid
        of peerConnections.keys()
    ) {

        removePeerConnection(
            remoteUid
        );

    }


    // =================================================
    // STOP MEDIA
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
    // UNSUBSCRIBE
    // =================================================

    unsubscribeFunctions
        .forEach(
            unsubscribe => {

                try {

                    unsubscribe();

                } catch (error) {}

            }
        );


    // =================================================
    // CHECK IF HOST
    // =================================================

    if (isHost) {

        try {

            await updateDoc(
                doc(
                    db,
                    "groupCalls",
                    callId
                ),
                {

                    status:
                        "active"

                }
            );

        } catch (error) {}

    }


    window.history.back();

}


// =====================================================
// END CALL BUTTON
// =====================================================

if (groupEndCallBtn) {

    groupEndCallBtn.addEventListener(
        "click",
        leaveGroupCall
    );

}


// =====================================================
// AUTH
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            user;


        if (!groupId) {

            alert(
                "Group ID is missing."
            );

            window.history.back();

            return;

        }

        if (!callId) {

    alert(
        "Call session is missing."
    );

    window.history.back();

    return;

        }


        try {

            await loadGroup();

            await getLocalMedia();


            await joinGroupCall();


        } catch (error) {

            console.error(
                "Group call startup error:",
                error
            );


            alert(
                error.message ||
                "Unable to start group call."
            );


            window.history.back();

        }

    }
);


// =====================================================
// PAGE CLEANUP
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


        for (
            const connection
            of peerConnections.values()
        ) {

            try {

                connection.close();

            } catch (error) {}

        }

    }
);
