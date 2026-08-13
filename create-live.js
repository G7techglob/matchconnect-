import { auth, db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const cameraPreview =
    document.getElementById("cameraPreview");

const liveTitle =
    document.getElementById("liveTitle");

const liveDescription =
    document.getElementById("liveDescription");

const startLiveBtn =
    document.getElementById("startLiveBtn");


let cameraStream = null;


/* =====================================================
   START CAMERA
===================================================== */

async function startCamera() {

    try {

        cameraStream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

        cameraPreview.srcObject =
            cameraStream;

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        alert(
            "Camera and microphone permission are required to go live."
        );

    }

}


startCamera();


/* =====================================================
   START LIVE
===================================================== */

startLiveBtn.addEventListener(
    "click",
    async () => {

        const user = auth.currentUser;

        if (!user) {

            alert(
                "Please log in before going live."
            );

            return;
        }


        const title =
            liveTitle.value.trim();

        const description =
            liveDescription.value.trim();


        if (!title) {

            alert(
                "Please enter a title for your live stream."
            );

            return;
        }


        try {

            startLiveBtn.disabled = true;

            startLiveBtn.textContent =
                "Starting...";


            const streamRef =
                await addDoc(
                    collection(db, "liveStreams"),
                    {

                        hostId: user.uid,

                        hostName:
                            user.displayName ||
                            user.email ||
                            "MatchConnect User",

                        hostPhoto:
                            user.photoURL || "",

                        title: title,

                        description: description,

                        status: "live",

                        viewerCount: 0,

                        likes: 0,

                        streamType: "live",

                        createdAt:
                            serverTimestamp(),

                        endedAt: null

                    }
                );


            /*
             * The actual WebRTC connection
             * will be attached to this stream ID.
             */

            window.location.href =
                `live.html?streamId=${encodeURIComponent(
                    streamRef.id
                )}`;

        } catch (error) {

            console.error(
                "Unable to start stream:",
                error
            );

            alert(
                "Unable to start your live stream."
            );

            startLiveBtn.disabled = false;

            startLiveBtn.textContent =
                "🔴 Start Live";

        }

    }
);
