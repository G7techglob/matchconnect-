import { auth, db, storage } from "./firebase.js";

import {
    doc,
    getDoc,
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


console.log("✅ HOST Live JS loaded");


// =====================================================
// STREAM ID
// =====================================================

const params =
    new URLSearchParams(window.location.search);

const streamId =
    params.get("streamId");


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

let mediaRecorder = null;

let recordedChunks = [];

let recordedVideoBlob = null;

let shouldSaveVideo = false;


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

    window.location.replace("stream.html");

}


// =====================================================
// AUTH
// =====================================================

auth.onAuthStateChanged(
    async (user) => {

        if (!user) {

            alert(
                "Please log in before managing your live."
            );

            window.location.replace(
                "stream.html"
            );

            return;
        }


        const loaded =
            await loadHostStream(user);


        if (!loaded) {
            return;
        }


        await startCamera();

        startSignaling();

        startLiveChat();

    }
);


// =====================================================
// LOAD HOST STREAM
// =====================================================

async function loadHostStream(user) {

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

            window.location.replace(
                "stream.html"
            );

            return false;
        }


        const stream =
            streamSnap.data();


        // =================================================
        // SECURITY CHECK
        // =================================================

        if (stream.hostId !== user.uid) {

            alert(
                "Only the host can open this live screen."
            );

            window.location.replace(
                `watch-live.html?streamId=${encodeURIComponent(
                    streamId
                )}`
            );

            return false;
        }


        // =================================================
        // CHECK LIVE STATUS
        // =================================================

        if (stream.status !== "live") {

            alert(
                "This live stream has already ended."
            );

            window.location.replace(
                "stream.html"
            );

            return false;
        }


        // =================================================
        // DISPLAY STREAM INFORMATION
        // =================================================

        const streamName =
            stream.title ||
            "MatchConnect Live";


        if (streamTitle) {
            streamTitle.textContent =
                streamName;
        }


        if (title) {
            title.textContent =
                streamName;
        }


        if (description) {

            description.textContent =
                stream.description || "";

        }


        if (viewerCount) {

            viewerCount.textContent =
                stream.viewerCount || 0;

        }


        // =================================================
        // WATCH VIEWERS
        // =================================================

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


                if (viewerCount) {

                    viewerCount.textContent =
                        count;

                }


                updateDoc(
                    streamRef,
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
        );


        console.log(
            "✅ Host stream loaded:",
            streamId
        );


        return true;


    } catch (error) {

        console.error(
            "Load host stream error:",
            error
        );

        alert(
            "Unable to load your live stream."
        );

        window.location.replace(
            "stream.html"
        );

        return false;

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


        console.log(
            "✅ Host camera and microphone ready"
        );


        startLiveRecording();


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        alert(
            "Camera and microphone permission are required."
        );

    }

}


// =====================================================
// START LIVE RECORDING
// =====================================================

function startLiveRecording() {

    if (!localStream) {
        return;
    }


    recordedChunks = [];

    recordedVideoBlob = null;


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
                        mimeType
                    }
                )
                : new MediaRecorder(
                    localStream
                );


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


        mediaRecorder.onstop =
            () => {

                if (
                    recordedChunks.length === 0
                ) {

                    console.warn(
                        "⚠️ No recording data captured."
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
                    "✅ Recording ready:",
                    recordedVideoBlob.size,
                    "bytes"
                );

            };


        mediaRecorder.start(1000);


        console.log(
            "🔴 LIVE RECORDING STARTED"
        );


    } catch (error) {

        console.error(
            "❌ Recording error:",
            error
        );

    }

}


// =====================================================
// SAVE LIVE RECORDING
// =====================================================

async function saveLiveRecording() {

    if (!recordedVideoBlob) {

        console.warn(
            "⚠️ No recording available."
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


        const videoURL =
            await getDownloadURL(
                videoRef
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
            "✅ Live recording saved"
        );


    } catch (error) {

        console.error(
            "❌ Unable to save recording:",
            error
        );

    }

}


// =====================================================
// WEBRTC HOST SIGNALING
// =====================================================

function startSignaling() {

    console.log(
        "📡 HOST signaling started"
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
                const change of
                snapshot.docChanges()
            ) {

                if (
                    change.type !== "added"
                ) {
                    continue;
                }


                const viewerId =
                    change.doc.id;


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
// CREATE HOST CONNECTION TO VIEWER
// =====================================================

async function createViewerConnection(
    viewerId,
    offerData
) {

    try {

        if (!localStream) {

            console.error(
                "❌ Host stream unavailable."
            );

            return;

        }


        const pc =
            new RTCPeerConnection(
                rtcConfig
            );


        peerConnections[viewerId] =
            pc;


        // =================================================
        // SEND HOST CAMERA + MICROPHONE
        // =================================================

        localStream
            .getTracks()
            .forEach(track => {

                pc.addTrack(
                    track,
                    localStream
                );

            });


        // =================================================
        // HOST ICE
        // =================================================

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

                } catch (error) {

                    console.error(
                        "Host ICE error:",
                        error
                    );

                }

            };


        // =================================================
        // CONNECTION STATE
        // =================================================

        pc.onconnectionstatechange =
            () => {

                console.log(
                    "🔗 Viewer connection:",
                    viewerId,
                    pc.connectionState
                );


                if (
                    pc.connectionState ===
                    "failed" ||
                    pc.connectionState ===
                    "closed"
                ) {

                    delete peerConnections[
                        viewerId
                    ];

                }

            };


        // =================================================
        // ANSWER DOCUMENT
        // =================================================

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


        // =================================================
        // RECEIVE VIEWER OFFER
        // =================================================

        await pc.setRemoteDescription(

            new RTCSessionDescription({

                type:
                    offerData.type,

                sdp:
                    offerData.sdp

            })

        );


        // =================================================
        // CREATE ANSWER
        // =================================================

        const answer =
            await pc.createAnswer();


        await pc.setLocalDescription(
            answer
        );


        await waitForIceGathering(
            pc
        );


        // =================================================
        // SEND ANSWER
        // =================================================

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


        // =================================================
        // RECEIVE VIEWER ICE
        // =================================================

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

                    } catch (error) {

                        console.error(
                            "Viewer ICE error:",
                            error
                        );

                    }

                }

            }
        );


    } catch (error) {

        console.error(
            "❌ Host WebRTC error:",
            error
        );

    }

}


// =====================================================
// WAIT FOR ICE
// =====================================================

function waitForIceGathering(pc) {

    return new Promise(resolve => {

        if (
            pc.iceGatheringState ===
            "complete"
        ) {

            resolve();

            return;

        }


        const checkIce =
            () => {

                if (
                    pc.iceGatheringState ===
                    "complete"
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
// END LIVE BUTTON
// =====================================================

endLiveBtn.addEventListener(
    "click",
    async () => {

        if (isEnding) {
            return;
        }


        const confirmed =
            confirm(
                "Do you want to end your live stream?"
            );


        if (!confirmed) {
            return;
        }


        shouldSaveVideo =
            confirm(
                "Do you want to save this live video?\n\n" +
                "OK = Save Video\n" +
                "Cancel = Discard Video"
            );


        await endLive();

    }
);


// =====================================================
// END LIVE
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


        // =================================================
        // STOP RECORDING
        // =================================================

        if (
            mediaRecorder &&
            mediaRecorder.state !== "inactive"
        ) {

            await new Promise(resolve => {

                mediaRecorder.addEventListener(
                    "stop",
                    resolve,
                    {
                        once: true
                    }
                );


                mediaRecorder.stop();

            });

        }


        // =================================================
        // SAVE VIDEO
        // =================================================

        if (
            shouldSaveVideo &&
            recordedVideoBlob
        ) {

            await saveLiveRecording();

        } else {

            recordedChunks = [];

            recordedVideoBlob = null;

            console.log(
                "🗑️ Live recording discarded"
            );

        }


        // =================================================
        // STOP CAMERA
        // =================================================

        if (localStream) {

            localStream
                .getTracks()
                .forEach(track => {
                    track.stop();
                });

            localStream = null;

        }


        // =================================================
        // CLOSE VIEWER CONNECTIONS
        // =================================================

        Object.values(
            peerConnections
        ).forEach(pc => {

            try {
                pc.close();
            } catch {}

        });


        peerConnections = {};


        // =================================================
        // MARK STREAM ENDED
        // =================================================

        await updateDoc(

            doc(
                db,
                "liveStreams",
                streamId
            ),

            {

                status:
                    "ended",

                endedAt:
                    serverTimestamp(),

                viewerCount:
                    0

            }

        );


        console.log(
            "🛑 LIVE ENDED:",
            streamId
        );


        window.location.replace(
            "stream.html"
        );


    } catch (error) {

        console.error(
            "❌ End live error:",
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
// BACK BUTTON — HOST ONLY
// =====================================================

backBtn.addEventListener(
    "click",
    () => {

        /*
         * IMPORTANT:
         * Back does NOT end the live.
         *
         * The stream remains:
         *
         * status = "live"
         *
         * The host can return to it later.
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

            try {
                pc.close();
            } catch {}

        });


        peerConnections = {};


        window.location.replace(
            "stream.html"
        );

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


            snapshot.forEach(
                messageDoc => {

                    messages.push({
                        id:
                            messageDoc.id,

                        ...messageDoc.data()

                    });

                }
            );


            messages.sort(
                (a, b) => {

                    const timeA =
                        a.createdAt
                            ?.toMillis?.() || 0;

                    const timeB =
                        b.createdAt
                            ?.toMillis?.() || 0;

                    return timeA - timeB;

                }
            );


            chatMessages.innerHTML = "";


            messages.forEach(
                message => {

                    const messageDiv =
                        document.createElement(
                            "div"
                        );


                    messageDiv.className =
                        "live-chat-message";


                    const username =
                        document.createElement(
                            "strong"
                        );


                    username.textContent =
                        message.username ||
                        "User";


                    const text =
                        document.createElement(
                            "span"
                        );


                    text.textContent =
                        message.text || "";


                    messageDiv.appendChild(
                        username
                    );


                    messageDiv.appendChild(
                        document.createTextNode(
                            " "
                        )
                    );


                    messageDiv.appendChild(
                        text
                    );


                    chatMessages.appendChild(
                        messageDiv
                    );

                }
            );


            chatMessages.scrollTop =
                chatMessages.scrollHeight;

        },


        error => {

            console.error(
                "Live chat listener error:",
                error
            );

        }

    );

}


// =====================================================
// SEND CHAT
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

        sendChatBtn.disabled =
            true;


        await addDoc(

            collection(
                db,
                "liveStreams",
                streamId,
                "messages"
            ),

            {

                userId:
                    user.uid,

                username:
                    user.displayName ||
                    user.email ||
                    "MatchConnect User",

                photoURL:
                    user.photoURL || "",

                text:
                    text,

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

        sendChatBtn.disabled =
            false;

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
// CLEANUP
// =====================================================

window.addEventListener(
    "beforeunload",
    () => {

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

            try {
                pc.close();
            } catch {}

        });

    }
);
