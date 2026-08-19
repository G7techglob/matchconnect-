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


// ==========
