import { auth, db } from "./firebase.js";

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
                "Please log in before going live."
            );

            window.location.href =
                "stream.html";

            return;
        }


        await loadStream();

        await startCamera();

        startSignaling();

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
            stream.hostId !==
            auth.currentUser.uid
        ) {

            alert(
                "You are not the owner of this live stream."
            );

            window.location.href =
                "stream.html";

            return;
        }


        if (
            stream.status !== "live"
        ) {

            alert(
                "This stream has already ended."
            );

            window.location.href =
                "stream.html";

            return;
        }


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

        const pc =
            new RTCPeerConnection(
                rtcConfig
            );


        peerConnections[viewerId] =
            pc;


        // Add host camera tracks

        if (localStream) {

            localStream
                .getTracks()
                .forEach(track => {

                    pc.addTrack(
                        track,
                        localStream
                    );

                });

        }


        // ICE candidates

        pc.onicecandidate =
            async (event) => {

                if (!event.candidate) {
                    return;
                }


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

            };


        // Viewer answer

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
            }
        );


        await pc.setRemoteDescription({

            type: "offer",

            sdp: offerData.sdp

        });


        const answer =
            await pc.createAnswer();


        await pc.setLocalDescription(
            answer
        );


        await updateDoc(
            answerRef,
            {
                answer: {
                    type: answer.type,
                    sdp: answer.sdp
                }
            }
        );


        // Listen for viewer ICE candidates

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
            snapshot => {

                snapshot.docChanges()
                    .forEach(
                        async change => {

                            if (
                                change.type !== "added"
                            ) {
                                return;
                            }


                            try {

                                await pc.addIceCandidate(
                                    new RTCIceCandidate(
                                        change.doc.data()
                                    )
                                );

                            } catch (error) {

                                console.error(
                                    "ICE candidate error:",
                                    error
                                );

                            }

                        }
                    );

            }
        );


        console.log(
            "✅ Connection created for viewer:",
            viewerId
        );


    } catch (error) {

        console.error(
            "Viewer connection error:",
            error
        );

    }

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
                "Are you sure you want to end your live stream?"
            );


        if (!confirmEnd) {
            return;
        }


        await endLive();

    }
);


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


        window.location.href =
            "stream.html";


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

        const confirmLeave =
            confirm(
                "Your live stream is running. End it?"
            );


        if (!confirmLeave) {
            return;
        }


        await endLive();

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
