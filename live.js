import { auth, db ,storage } from "./firebase.js";

import {
    doc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    setDoc,
    collection,
    addDoc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

console.log("✅ Live WebRTC JS loaded");


// =====================================================
// STREAM ID
// =====================================================

const params = new URLSearchParams(
    window.location.search
);

const streamId = params.get("streamId");


// =====================================================
// ELEMENTS
// =====================================================

const localVideo =
    document.getElementById("localVideo");

const streamTitle =
    document.getElementById("streamTitle");

const title =
    document.getElementById("title");

const description =
    document.getElementById("description");

const viewerCount =
    document.getElementById("viewerCount");

const micBtn =
    document.getElementById("micBtn");

const cameraBtn =
    document.getElementById("cameraBtn");

const switchCameraBtn =
    document.getElementById("switchCameraBtn");

const endLiveBtn =
    document.getElementById("endLiveBtn");

const backBtn =
    document.getElementById("backBtn");


const chatInput =
    document.getElementById("chatInput");

const sendChatBtn =
    document.getElementById("sendChatBtn");

const chatMessages =
    document.getElementById("chatMessages");


// =====================================================
// VARIABLES
// =====================================================

let localStream = null;

let usingFrontCamera = true;

let microphoneEnabled = true;

let cameraEnabled = true;

let peerConnections = {};

let isEnding = false;

let isHost = false;

let viewerPeerConnection = null;

let saveVideo = false;

let mediaRecorder = null;

let recordedChunks = [];

let recordedVideoBlob = null;



// =====================================================
// WEBRTC CONFIG
// =====================================================

const rtcConfig = {

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
// CHECK STREAM ID
// =====================================================

if (!streamId) {

    alert("Live stream not found.");

    window.location.href =
        "stream.html";

}
// =====================================================
// AUTH
// =====================================================

auth.onAuthStateChanged(
    async (user) => {

        if (!user) {

            alert(
                "Please log in before joining the live."
            );

            window.location.href =
                "stream.html";

            return;
        }


        const streamLoaded =
            await loadStream();


        if (!streamLoaded) {
            return;
        }


        if (isHost) {

            console.log(
                "🎥 Current user is the HOST"
            );

            await startCamera();

            startSignaling();

        } else {

            console.log(
                "👀 Current user is a VIEWER"
            );

            /*
             * Viewer does not need camera
             * or microphone.
             */

            

            /*
             * Hide host-only controls.
             */

            if (micBtn) {
                micBtn.style.display = "none";
            }

            if (cameraBtn) {
                cameraBtn.style.display = "none";
            }

            if (switchCameraBtn) {
                switchCameraBtn.style.display = "none";
            }

            if (endLiveBtn) {
                endLiveBtn.style.display = "none";
            }


            await startViewerSignaling();

        }

    }
);

// =====================================================
// LOAD STREAM
// =====================================================

async function loadStream() {

    try {

        const streamRef =
            doc(
                db,
                "liveStreams",
                streamId
            );


        const streamSnap =
            await getDoc(streamRef);


        if (!streamSnap.exists()) {

            alert(
                "This live stream does not exist."
            );

            window.location.href =
                "stream.html";

            return;
        }


        const stream =
    streamSnap.data();


if (
    stream.status !== "live"
) {

    alert(
        "This live stream has already ended."
    );

    window.location.href =
        "stream.html";

    return false;
}


isHost =
    stream.hostId === auth.currentUser.uid;

        const streamName =
            stream.title ||
            "MatchConnect Live";


        streamTitle.textContent =
            streamName;

        title.textContent =
            streamName;

        description.textContent =
            stream.description || "";


        viewerCount.textContent =
            stream.viewerCount || 0;

        // =====================================================
// WATCH VIEWERS
// =====================================================

onSnapshot(
    collection(
        db,
        "liveStreams",
        streamId,
        "viewers"
    ),
    (snapshot) => {

        const count =
            snapshot.size;

        viewerCount.textContent =
            count;

        if (isHost) {

            updateDoc(
                doc(
                    db,
                    "liveStreams",
                    streamId
                ),
                {
                    viewerCount: count
                }
            ).catch(error => {

                console.error(
                    "Viewer count update error:",
                    error
                );

            });

        }

    }
);
        onSnapshot(
    doc(db, "liveStreams", streamId),
    (snapshot) => {

        if (!snapshot.exists()) {
            return;
        }

        const data = snapshot.data();

        viewerCount.textContent =
            data.viewerCount || 0;

    }
);
        return true;


    } catch (error) {

        console.error(
            "Load stream error:",
            error
        );

    }

}


// =====================================================
// CAMERA
// =====================================================

async function startCamera() {

    try {

        if (localStream) {

            localStream
                .getTracks()
                .forEach(track => {
                    track.stop();
                });

        }


        localStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode:
                        usingFrontCamera
                        ? "user"
                        : "environment"
                },

                audio: true

            });


        localVideo.srcObject =
            localStream;

        // =====================================================
// START LIVE RECORDING
// =====================================================

if (isHost) {

    startLiveRecording();

}


        console.log(
            "✅ Camera and microphone ready"
        );


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        alert(
            "Camera or microphone permission is required."
        );

    }

}


// =====================================================
// START LIVE RECORDING
// =====================================================

function startLiveRecording() {

    if (!isHost) {
        return;
    }

    if (!localStream) {

        console.error(
            "❌ Cannot start recording: host stream is missing"
        );

        return;
    }


    // Reset previous recording data

    recordedChunks = [];

    recordedVideoBlob = null;


    // =============================================
    // CHECK SUPPORTED RECORDING FORMAT
    // =============================================

    let mimeType = "";

    if (
        MediaRecorder.isTypeSupported(
            "video/webm;codecs=vp9,opus"
        )
    ) {

        mimeType =
            "video/webm;codecs=vp9,opus";

    } else if (
        MediaRecorder.isTypeSupported(
            "video/webm;codecs=vp8,opus"
        )
    ) {

        mimeType =
            "video/webm;codecs=vp8,opus";

    } else if (
        MediaRecorder.isTypeSupported(
            "video/webm"
        )
    ) {

        mimeType =
            "video/webm";

    }


    try {

        mediaRecorder =
            mimeType
            ? new MediaRecorder(
                localStream,
                {
                    mimeType: mimeType
                }
            )
            : new MediaRecorder(
                localStream
            );


        // =========================================
        // RECORDING DATA
        // =========================================

        mediaRecorder.ondataavailable =
            (event) => {

                if (
                    event.data &&
                    event.data.size > 0
                ) {

                    recordedChunks.push(
                        event.data
                    );

                }

            };


        // =========================================
        // RECORDING FINISHED
        // =========================================

        mediaRecorder.onstop =
            () => {

                if (
                    recordedChunks.length === 0
                ) {

                    console.warn(
                        "⚠️ No recording data was captured."
                    );

                    return;
                }


                recordedVideoBlob =
                    new Blob(
                        recordedChunks,
                        {
                            type:
                                mediaRecorder.mimeType ||
                                "video/webm"
                        }
                    );


                console.log(
                    "✅ Live recording created:",
                    recordedVideoBlob.size,
                    "bytes"
                );

            };


        // =========================================
        // START RECORDING
        // =========================================

        mediaRecorder.start(
            1000
        );


        console.log(
            "🔴 LIVE RECORDING STARTED"
        );


    } catch (error) {

        console.error(
            "❌ Unable to start live recording:",
            error
        );

    }

}

// =====================================================
// SAVE LIVE RECORDING
// =====================================================

async function saveLiveRecording() {

    if (!isHost) {
        return;
    }

    if (!recordedVideoBlob) {

        console.warn(
            "⚠️ No recorded video available to save."
        );

        return;
    }

    try {

        console.log(
            "☁️ Uploading live recording..."
        );


        const videoPath =
            `liveVideos/${auth.currentUser.uid}/${streamId}.webm`;


        const videoRef =
            ref(
                storage,
                videoPath
            );


        await uploadBytes(
            videoRef,
            recordedVideoBlob,
            {
                contentType:
                    "video/webm"
            }
        );


        console.log(
            "✅ Live video uploaded to Storage"
        );


        const videoURL =
            await getDownloadURL(
                videoRef
            );


        console.log(
            "✅ Video URL created"
        );


        await updateDoc(
            doc(
                db,
                "liveStreams",
                streamId
            ),
            {

                videoURL:
                    videoURL,

                videoPath:
                    videoPath,

                videoSaved:
                    true,

                savedAt:
                    serverTimestamp()

            }
        );


        console.log(
            "✅ Live video saved successfully"
        );


    } catch (error) {

        console.error(
            "❌ Unable to save live recording:",
            error
        );

    }

}

// =====================================================
// WEBRTC SIGNALING
// =====================================================

function startSignaling() {

    console.log(
        "📡 WebRTC signaling started"
    );


    const offersRef =
        collection(
            db,
            "liveStreams",
            streamId,
            "offers"
        );


    onSnapshot(
        offersRef,
        async (snapshot) => {

            for (
                const change of snapshot.docChanges()
            ) {

                if (
                    change.type !== "added"
                ) {
                    continue;
                }


                const viewerId =
                    change.doc.id;

                console.log(
    "👤 HOST RECEIVED VIEWER OFFER:",
    viewerId
);


                if (
                    peerConnections[viewerId]
                ) {
                    continue;
                }


                console.log(
                    "👤 New viewer:",
                    viewerId
                );


                await createViewerConnection(
                    viewerId,
                    change.doc.data()
                );

            }

        }
    );

}


// =====================================================
// CREATE VIEWER CONNECTION
// =====================================================

async function createViewerConnection(
    viewerId,
    offerData
) {

    try {

        console.log(
            "🎥 Creating host connection for viewer:",
            viewerId
        );

        const pc =
            new RTCPeerConnection(
                rtcConfig
            );

        peerConnections[viewerId] =
            pc;


        // =============================================
        // ADD HOST CAMERA AND MICROPHONE
        // =============================================

        if (!localStream) {

            console.error(
                "❌ Host local stream is missing"
            );

            return;
        }

        localStream
            .getTracks()
            .forEach(track => {

                pc.addTrack(
                    track,
                    localStream
                );

            });

        console.log(
            "✅ Host camera and microphone added"
        );


        // =============================================
        // HOST ICE CANDIDATES
        // =============================================

        pc.onicecandidate =
            async (event) => {

                if (!event.candidate) {
                    return;
                }

                try {

                    await addDoc(

                        collection(
                            db,
                            "liveStreams",
                            streamId,
                            "viewers",
                            viewerId,
                            "hostCandidates"
                        ),

                        event.candidate.toJSON()

                    );

                    console.log(
                        "📡 Host ICE candidate sent"
                    );

                } catch (error) {

                    console.error(
                        "❌ Host ICE error:",
                        error
                    );

                }

            };


        // =============================================
        // CONNECTION STATUS
        // =============================================

        pc.onconnectionstatechange =
            () => {

                console.log(
                    "🔗 Host connection:",
                    pc.connectionState
                );

            };


        pc.oniceconnectionstatechange =
            () => {

                console.log(
                    "🧊 Host ICE:",
                    pc.iceConnectionState
                );

            };


        // =============================================
        // VIEWER ANSWER DOCUMENT
        // =============================================

        const answerRef =
            doc(
                db,
                "liveStreams",
                streamId,
                "viewers",
                viewerId
            );


        await setDoc(
            answerRef,
            {
                answer: null
            },
            {
                merge: true
            }
        );


        // =============================================
        // RECEIVE VIEWER OFFER
        // =============================================

        await pc.setRemoteDescription(

            new RTCSessionDescription({

                type:
                    offerData.type,

                sdp:
                    offerData.sdp

            })

        );


        console.log(
            "✅ Viewer offer received by host"
        );


        // =============================================
        // CREATE HOST ANSWER
        // =============================================

        const answer =
            await pc.createAnswer();


        await pc.setLocalDescription(
            answer
        );


        // =============================================
        // WAIT FOR HOST ICE
        // =============================================

        await waitForIceGathering(
            pc
        );


        console.log(
            "✅ Host ICE gathering complete"
        );


        // =============================================
        // SEND ANSWER TO VIEWER
        // =============================================

        await updateDoc(
            answerRef,
            {

                answer: {

                    type:
                        pc.localDescription.type,

                    sdp:
                        pc.localDescription.sdp

                }

            }
        );


        console.log(
            "📡 Host answer sent to viewer"
        );


        // =============================================
        // RECEIVE VIEWER ICE
        // =============================================

        const viewerCandidatesRef =
            collection(
                db,
                "liveStreams",
                streamId,
                "viewers",
                viewerId,
                "viewerCandidates"
            );


        onSnapshot(
            viewerCandidatesRef,
            async (snapshot) => {

                for (
                    const change of
                    snapshot.docChanges()
                ) {

                    if (
                        change.type !== "added"
                    ) {
                        continue;
                    }

                    try {

                        await pc.addIceCandidate(

                            new RTCIceCandidate(
                                change.doc.data()
                            )

                        );

                        console.log(
                            "🧊 Viewer ICE received by host"
                        );

                    } catch (error) {

                        console.error(
                            "❌ Viewer ICE error:",
                            error
                        );

                    }

                }

            }
        );


        console.log(
            "✅ Host connection ready"
        );


    } catch (error) {

        console.error(
            "❌ Host WebRTC error:",
            error
        );

    }

                        }


// =====================================================
// WAIT FOR ICE GATHERING
// =====================================================

function waitForIceGathering(pc) {

    return new Promise(resolve => {

        if (
            pc.iceGatheringState === "complete"
        ) {

            resolve();

            return;

        }


        const checkIce =
            () => {

                if (
                    pc.iceGatheringState === "complete"
                ) {

                    pc.removeEventListener(
                        "icegatheringstatechange",
                        checkIce
                    );

                    resolve();

                }

            };


        pc.addEventListener(
            "icegatheringstatechange",
            checkIce
        );

    });

}
// =====================================================
// MICROPHONE
// =====================================================

micBtn.addEventListener(
    "click",
    () => {

        if (!localStream) {
            return;
        }


        localStream
            .getAudioTracks()
            .forEach(track => {

                track.enabled =
                    !track.enabled;

                microphoneEnabled =
                    track.enabled;

            });


        micBtn.textContent =
            microphoneEnabled
            ? "🎤"
            : "🔇";

    }
);


// =====================================================
// CAMERA
// =====================================================

cameraBtn.addEventListener(
    "click",
    () => {

        if (!localStream) {
            return;
        }


        localStream
            .getVideoTracks()
            .forEach(track => {

                track.enabled =
                    !track.enabled;

                cameraEnabled =
                    track.enabled;

            });


        cameraBtn.textContent =
            cameraEnabled
            ? "📷"
            : "🚫";

    }
);


// =====================================================
// SWITCH CAMERA
// =====================================================

switchCameraBtn.addEventListener(
    "click",
    async () => {

        usingFrontCamera =
            !usingFrontCamera;


        await startCamera();


        // Replace video track in
        // existing WebRTC connections

        const newVideoTrack =
            localStream.getVideoTracks()[0];


        Object.values(
            peerConnections
        ).forEach(pc => {

            const sender =
                pc.getSenders()
                    .find(
                        s =>
                            s.track &&
                            s.track.kind ===
                            "video"
                    );


            if (sender) {

                sender.replaceTrack(
                    newVideoTrack
                );

            }

        });

    }
);


// =====================================================
// END LIVE
// =====================================================

endLiveBtn.addEventListener(
    "click",
    async () => {

        const confirmEnd =
    confirm(
        "Do you want to end your live stream?"
    );


if (!confirmEnd) {
    return;
}


// =====================================================
// ASK WHETHER TO SAVE VIDEO
// =====================================================

const saveVideo =
    confirm(
        "Do you want to save this live video?\n\n" +
        "OK = Save Video\n" +
        "Cancel = Discard Video"
    );

        await endLive();

    }
);

// =====================================================
// SAVE OR DISCARD RECORDING
// =====================================================

if (saveVideo) {

    console.log(
        "💾 User chose to SAVE the live video"
    );

} else {

    console.log(
        "🗑️ User chose to DISCARD the live video"
    );

}


// =====================================================
// END LIVE FUNCTION
// =====================================================

async function endLive() {

    if (isEnding) {
        return;
    }


    try {

        isEnding = true;


        endLiveBtn.disabled =
            true;


        endLiveBtn.textContent =
            "Ending...";

        
// =====================================================
// STOP AND SAVE LIVE RECORDING
// =====================================================

if (
    mediaRecorder &&
    mediaRecorder.state !== "inactive"
) {

    await new Promise((resolve) => {

        mediaRecorder.addEventListener(
            "stop",
            resolve,
            {
                once: true
            }
        );

        mediaRecorder.stop();

    });


    console.log(
        "⏹️ LIVE RECORDING STOPPED"
    );


    // Save the finished recording

    if (saveVideo) {

    await saveLiveRecording();

} else {

    recordedChunks = [];

    recordedVideoBlob = null;

    console.log(
        "🗑️ Live video discarded"
    );

    }
}


        if (localStream) {

            localStream
                .getTracks()
                .forEach(track => {
                    track.stop();
                });

        }


        Object.values(
            peerConnections
        ).forEach(pc => {

            pc.close();

        });


        const streamRef =
            doc(
                db,
                "liveStreams",
                streamId
            );


        await updateDoc(
            streamRef,
            {

                status: "ended",

                endedAt:
                    serverTimestamp(),

                viewerCount: 0

            }
        );


        window.location.replace("stream.html");


    } catch (error) {

        console.error(
            "End live error:",
            error
        );


        alert(
            "Unable to end the live stream."
        );


        isEnding = false;

        endLiveBtn.disabled =
            false;

        endLiveBtn.textContent =
            "🛑 End Live";

    }

}
// =====================================================
// BACK
// =====================================================

backBtn.addEventListener(
    "click",
    async () => {

        // =========================================
        // VIEWER
        // =========================================

        if (!isHost) {

            if (viewerPeerConnection) {

                viewerPeerConnection.close();

                viewerPeerConnection = null;

            }

            window.location.href =
                "stream.html";

            return;
        }


        // =========================================
        // HOST
        // =========================================

        /*
         * IMPORTANT:
         * Going back does NOT end the live.
         *
         * The live remains active in Firestore.
         *
         * The host can return to this same
         * live stream later.
         */

        if (localStream) {

            localStream
                .getTracks()
                .forEach(track => {
                    track.stop();
                });

            localStream = null;

        }


        Object.values(
            peerConnections
        ).forEach(pc => {

            pc.close();

        });


        peerConnections = {};


        window.location.href =
            "stream.html";

    }
);


// =====================================================
// CLEANUP
// =====================================================

window.addEventListener(
    "beforeunload",
    () => {

        // Remove viewer from live viewer list
        if (!isHost && auth.currentUser && streamId) {

            deleteDoc(
                doc(
                    db,
                    "liveStreams",
                    streamId,
                    "viewers",
                    auth.currentUser.uid
                )
            ).catch(error => {

                console.error(
                    "❌ Unable to remove viewer:",
                    error
                );

            });

        }

        if (localStream) {

            localStream
                .getTracks()
                .forEach(track => {
                    track.stop();
                });

        }


        Object.values(
            peerConnections
        ).forEach(pc => {

            pc.close();

        });

    }
);

// =====================================================
// LIVE CHAT
// =====================================================

function startLiveChat() {

    if (!streamId) {
        return;
    }

    const messagesRef =
        collection(
            db,
            "liveStreams",
            streamId,
            "messages"
        );

    onSnapshot(
        messagesRef,
        (snapshot) => {

            const messages = [];

            snapshot.forEach(messageDoc => {

                messages.push({
                    id: messageDoc.id,
                    ...messageDoc.data()
                });

            });

            messages.sort((a, b) => {

                const timeA =
                    a.createdAt?.toMillis?.() || 0;

                const timeB =
                    b.createdAt?.toMillis?.() || 0;

                return timeA - timeB;

            });

            chatMessages.innerHTML = "";

            messages.forEach(message => {

                const messageDiv =
                    document.createElement("div");

                messageDiv.className =
                    "live-chat-message";

                const username =
                    document.createElement("strong");

                username.textContent =
                    message.username ||
                    "User";

                const text =
                    document.createElement("span");

                text.textContent =
                    message.text || "";

                messageDiv.appendChild(
                    username
                );

                messageDiv.appendChild(
                    document.createTextNode(" ")
                );

                messageDiv.appendChild(
                    text
                );

                chatMessages.appendChild(
                    messageDiv
                );

            });

            chatMessages.scrollTop =
                chatMessages.scrollHeight;

        },
        (error) => {

            console.error(
                "Live chat listener error:",
                error
            );

        }
    );

}


// =====================================================
// SEND CHAT MESSAGE
// =====================================================

async function sendChatMessage() {

    const user =
        auth.currentUser;

    if (!user) {

        alert(
            "Please log in to chat."
        );

        return;

    }

    const text =
        chatInput.value.trim();

    if (!text) {
        return;
    }

    try {

        sendChatBtn.disabled = true;

        const username =
            user.displayName ||
            user.email ||
            "MatchConnect User";

        await addDoc(

            collection(
                db,
                "liveStreams",
                streamId,
                "messages"
            ),

            {
                userId: user.uid,

                username: username,

                photoURL:
                    user.photoURL || "",

                text: text,

                createdAt:
                    serverTimestamp()
            }

        );

        chatInput.value = "";

    } catch (error) {

        console.error(
            "Send live chat error:",
            error
        );

        alert(
            "Unable to send your message."
        );

    } finally {

        sendChatBtn.disabled = false;

        chatInput.focus();

    }

}


// =====================================================
// CHAT EVENTS
// =====================================================

sendChatBtn.addEventListener(
    "click",
    sendChatMessage
);


chatInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendChatMessage();

        }

    }
);


// =====================================================
// START LIVE CHAT
// =====================================================

startLiveChat();

// =====================================================
// VIEWER WEBRTC
// =====================================================

async function startViewerSignaling() {

    if (!streamId) {

        console.error(
            "❌ No stream ID"
        );

        return;
    }

    console.log(
        "👀 Starting viewer WebRTC..."
    );


    try {

        // =================================================
        // CREATE VIEWER PEER CONNECTION
        // =================================================

        viewerPeerConnection =
            new RTCPeerConnection(
                rtcConfig
            );

        console.log(
            "✅ Viewer peer connection created"
        );


        // =================================================
        // IMPORTANT:
        // REQUEST HOST VIDEO AND AUDIO
        // =================================================

        viewerPeerConnection.addTransceiver(
            "video",
            {
                direction: "recvonly"
            }
        );

        viewerPeerConnection.addTransceiver(
            "audio",
            {
                direction: "recvonly"
            }
        );

        console.log(
            "✅ Viewer is requesting host video and audio"
        );


        // =================================================
        // REGISTER VIEWER
        // =================================================

        const viewerId =
            auth.currentUser.uid;


        const viewerRef =
            doc(
                db,
                "liveStreams",
                streamId,
                "viewers",
                viewerId
            );


        await setDoc(
            viewerRef,
            {
                userId: viewerId,

                role: "viewer",

                joinedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );


        console.log(
            "✅ Viewer registered:",
            viewerId
        );


        // =================================================
        // RECEIVE HOST VIDEO/AUDIO
        // =================================================

        viewerPeerConnection.ontrack =
            (event) => {

                console.log(
                    "🎥 HOST TRACK RECEIVED"
                );


                let remoteStream =
                    event.streams &&
                    event.streams[0];


                // -----------------------------------------
                // If browser does not provide a stream,
                // create one manually.
                // -----------------------------------------

                if (!remoteStream) {

                    remoteStream =
                        new MediaStream();

                    remoteStream.addTrack(
                        event.track
                    );

                }


                console.log(
                    "🎥 Remote track:",
                    event.track.kind
                );


                // -----------------------------------------
                // Put host stream into viewer video
                // -----------------------------------------

                localVideo.srcObject =
                    remoteStream;


                localVideo.muted =
                    false;

                localVideo.autoplay =
                    true;

                localVideo.playsInline =
                    true;


                localVideo.play()
                    .then(() => {

                        console.log(
                            "✅ HOST VIDEO PLAYING"
                        );

                    })
                    .catch(error => {

                        console.warn(
                            "⚠️ Video autoplay blocked:",
                            error
                        );

                    });

            };


        // =================================================
        // CONNECTION STATE
        // =================================================

        viewerPeerConnection
            .onconnectionstatechange =
            () => {

                console.log(
                    "📡 Viewer connection state:",
                    viewerPeerConnection
                        .connectionState
                );


                if (
                    viewerPeerConnection
                        .connectionState ===
                    "connected"
                ) {

                    console.log(
                        "🎉 VIEWER CONNECTED TO HOST"
                    );

                }

            };


        // =================================================
        // ICE CONNECTION STATE
        // =================================================

        viewerPeerConnection
            .oniceconnectionstatechange =
            () => {

                console.log(
                    "🧊 Viewer ICE state:",
                    viewerPeerConnection
                        .iceConnectionState
                );

            };


        // =================================================
        // SEND VIEWER ICE CANDIDATES
        // =================================================

        viewerPeerConnection.onicecandidate =
            async (event) => {

                if (!event.candidate) {
                    return;
                }


                try {

                    await addDoc(

                        collection(
                            db,
                            "liveStreams",
                            streamId,
                            "viewers",
                            viewerId,
                            "viewerCandidates"
                        ),

                        event.candidate.toJSON()

                    );


                    console.log(
                        "🧊 Viewer ICE candidate sent"
                    );

                } catch (error) {

                    console.error(
                        "❌ Viewer ICE error:",
                        error
                    );

                }

            };


        // =================================================
        // HOST ANSWER
        // =================================================

        const answerRef =
            doc(
                db,
                "liveStreams",
                streamId,
                "viewers",
                viewerId
            );


        onSnapshot(
            answerRef,
            async (snapshot) => {

                if (!snapshot.exists()) {
                    return;
                }


                const data =
                    snapshot.data();


                if (!data.answer) {
                    return;
                }


                if (
                    viewerPeerConnection
                        .remoteDescription
                ) {

                    return;
                }


                try {

                    await viewerPeerConnection
                        .setRemoteDescription(

                            new RTCSessionDescription(
                                data.answer
                            )

                        );


                    console.log(
                        "✅ HOST ANSWER RECEIVED"
                    );


                } catch (error) {

                    console.error(
                        "❌ Unable to set host answer:",
                        error
                    );

                }

            }
        );


        // =================================================
        // RECEIVE HOST ICE CANDIDATES
        // =================================================

        const hostCandidatesRef =
            collection(
                db,
                "liveStreams",
                streamId,
                "viewers",
                viewerId,
                "hostCandidates"
            );


        onSnapshot(
            hostCandidatesRef,
            async (snapshot) => {

                for (
                    const change of
                    snapshot.docChanges()
                ) {

                    if (
                        change.type !== "added"
                    ) {

                        continue;
                    }


                    try {

                        await viewerPeerConnection
                            .addIceCandidate(

                                new RTCIceCandidate(
                                    change.doc.data()
                                )

                            );


                        console.log(
                            "🧊 Host ICE candidate added"
                        );


                    } catch (error) {

                        console.error(
                            "❌ Host ICE error:",
                            error
                        );

                    }

                }

            }
        );


        // =================================================
        // CREATE VIEWER OFFER
        // =================================================

        const offer =
            await viewerPeerConnection
                .createOffer();


        await viewerPeerConnection
            .setLocalDescription(
                offer
            );


        console.log(
            "📡 Viewer offer created"
        );


        // =================================================
        // SEND OFFER TO HOST
        // =================================================

        const offerRef =
            doc(
                db,
                "liveStreams",
                streamId,
                "offers",
                viewerId
            );


        await setDoc(
            offerRef,
            {

                sdp:
                    offer.sdp,

                type:
                    offer.type,

                viewerId:
                    viewerId,

                createdAt:
                    serverTimestamp()

            }
        );


        console.log(
            "📡 VIEWER OFFER SENT TO HOST"
        );


        // =================================================
        // WATCH VIEWER COUNT
        // =================================================

        const viewersRef =
            collection(
                db,
                "liveStreams",
                streamId,
                "viewers"
            );


        onSnapshot(
            viewersRef,
            (snapshot) => {

                const count =
                    snapshot.size;


                if (viewerCount) {

                    viewerCount.textContent =
                        count;

                }


                console.log(
                    "👁️ LIVE VIEWERS:",
                    count
                );

            },
            (error) => {

                console.error(
                    "❌ Viewer count error:",
                    error
                );

            }
        );


        console.log(
            "✅ Viewer WebRTC setup complete"
        );


    } catch (error) {

        console.error(
            "❌ VIEWER WEBRTC ERROR:",
            error
        );

    }

}
