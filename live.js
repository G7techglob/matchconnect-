import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


console.log("✅ Live JS loaded");


// =====================================================
// GET STREAM ID
// =====================================================

const params = new URLSearchParams(
    window.location.search
);

const streamId = params.get("streamId");


// =====================================================
// UI ELEMENTS
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


// =====================================================
// VARIABLES
// =====================================================

let localStream = null;

let usingFrontCamera = true;

let microphoneEnabled = true;

let cameraEnabled = true;

let isEnding = false;


// =====================================================
// CHECK STREAM ID
// =====================================================

if (!streamId) {

    alert("Live stream not found.");

    window.location.href = "stream.html";
}


// =====================================================
// CHECK USER
// =====================================================

auth.onAuthStateChanged(async (user) => {

    if (!user) {

        alert(
            "Please log in before starting a live stream."
        );

        window.location.href = "stream.html";

        return;
    }


    await loadStream();

    await startCamera();

});


// =====================================================
// LOAD STREAM
// =====================================================

async function loadStream() {

    try {

        const streamRef =
            doc(db, "liveStreams", streamId);

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


        // Make sure the stream belongs
        // to the logged-in user.

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


        // Check if already ended

        if (
            stream.status !== "live"
        ) {

            alert(
                "This live stream has already ended."
            );

            window.location.href =
                "stream.html";

            return;
        }


        // Display information

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
            "Error loading stream:",
            error
        );

        alert(
            "Unable to load your live stream."
        );

    }

}


// =====================================================
// START CAMERA
// =====================================================

async function startCamera() {

    try {

        // Stop previous camera first

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
            "✅ Camera and microphone started"
        );


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        alert(
            "Camera or microphone permission was denied."
        );

    }

}


// =====================================================
// MICROPHONE BUTTON
// =====================================================

micBtn.addEventListener(
    "click",
    () => {

        if (!localStream) {
            return;
        }


        const audioTracks =
            localStream.getAudioTracks();


        audioTracks.forEach(track => {

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
// CAMERA BUTTON
// =====================================================

cameraBtn.addEventListener(
    "click",
    () => {

        if (!localStream) {
            return;
        }


        const videoTracks =
            localStream.getVideoTracks();


        videoTracks.forEach(track => {

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

    }
);


// =====================================================
// END LIVE
// =====================================================

endLiveBtn.addEventListener(
    "click",
    async () => {

        if (isEnding) {
            return;
        }


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

    try {

        isEnding = true;

        endLiveBtn.disabled =
            true;

        endLiveBtn.textContent =
            "Ending...";


        // Stop camera

        if (localStream) {

            localStream
                .getTracks()
                .forEach(track => {
                    track.stop();
                });

        }


        // Update Firestore

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


        console.log(
            "✅ Live stream ended"
        );


        // Return to streaming page

        window.location.href =
            "stream.html";


    } catch (error) {

        console.error(
            "Error ending live:",
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
// BACK BUTTON
// =====================================================

backBtn.addEventListener(
    "click",
    async () => {

        const leave =
            confirm(
                "Your live stream is still running. Do you want to end it?"
            );


        if (!leave) {
            return;
        }


        await endLive();

    }
);


// =====================================================
// CLEAN UP WHEN PAGE CLOSES
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

    }
);
