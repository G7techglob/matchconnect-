import { auth, db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    setDoc,
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
   SEND LIVE NOTIFICATIONS
===================================================== */

async function notifyFollowers(
    streamId,
    user
) {

    try {

        console.log(
            "📢 Loading followers..."
        );


        /*
         * Followers are stored at:
         *
         * users/{hostUid}/followers/{followerId}
         */

        const followersRef =
            collection(
                db,
                "users",
                user.uid,
                "followers"
            );


        const followersSnapshot =
            await getDocs(
                followersRef
            );


        console.log(
            "👥 Followers found:",
            followersSnapshot.size
        );


        if (
            followersSnapshot.empty
        ) {

            console.log(
                "No followers to notify."
            );

            return;

        }


        /*
         * Create a notification
         * for every follower.
         */

        const notificationPromises =
            followersSnapshot.docs.map(
                async (followerDoc) => {

                    const followerData =
                        followerDoc.data();


                    /*
                     * Your follower document
                     * can contain userId.
                     *
                     * If it doesn't, we use
                     * the document ID.
                     */

                    const followerId =
                        followerData.userId ||
                        followerDoc.id;


                    /*
                     * Don't notify yourself.
                     */

                    if (
                        followerId ===
                        user.uid
                    ) {

                        return;

                    }


                    await addDoc(
                        collection(
                            db,
                            "notifications"
                        ),
                        {

                            /*
                             * Who receives
                             * the notification
                             */

                            userId:
                                followerId,


                            /*
                             * Who started
                             * the live
                             */

                            senderId:
                                user.uid,


                            /*
                             * Notification type
                             */

                            type:
                                "live",


                            /*
                             * The Live stream
                             * they should open
                             */

                            streamId:
                                streamId,


                            /*
                             * Useful extra
                             * information
                             */

                            streamTitle:
                                liveTitle.value.trim(),


                            createdAt:
                                serverTimestamp()

                        }
                    );

                }
            );


        await Promise.all(
            notificationPromises
        );


        console.log(
            "✅ Live notifications sent to followers."
        );


    } catch (error) {

        console.error(
            "❌ Error sending live notifications:",
            error
        );

        /*
         * We don't stop the Live if
         * notification creation fails.
         */

    }

}


/* =====================================================
   START LIVE
===================================================== */

startLiveBtn.addEventListener(
    "click",
    async () => {

        const user =
            auth.currentUser;


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

            startLiveBtn.disabled =
                true;

            startLiveBtn.textContent =
                "Starting...";


            /* =================================================
               CREATE LIVE STREAM
            ================================================= */

            const streamRef =
                await addDoc(
                    collection(
                        db,
                        "liveStreams"
                    ),
                    {

                        hostId:
                            user.uid,

                        hostName:
                            user.displayName ||
                            user.email ||
                            "MatchConnect User",

                        hostPhoto:
                            user.photoURL ||
                            "",

                        title:
                            title,

                        description:
                            description,

                        status:
                            "live",

                        viewerCount:
                            0,

                        likes:
                            0,

                        streamType:
                            "live",

                        createdAt:
                            serverTimestamp(),

                        endedAt:
                            null

                    }
                );


            console.log(
                "✅ Live stream created:",
                streamRef.id
            );

            /* =================================================
   ADD HOST AS FIRST PARTICIPANT
================================================= */

const hostParticipantRef =
    doc(
        db,
        "liveStreams",
        streamRef.id,
        "participants",
        user.uid
    );

await setDoc(
    hostParticipantRef,
    {
        userId:
            user.uid,

        username:
            user.displayName ||
            user.email ||
            "MatchConnect User",

        photoURL:
            user.photoURL ||
            "",

        role:
            "host",

        status:
            "active",

        joinedAt:
            serverTimestamp()
    }
);

console.log(
    "✅ Host added as live participant"
);


            /* =================================================
               NOTIFY FOLLOWERS
            ================================================= */

            await notifyFollowers(
                streamRef.id,
                user
            );


            /* =================================================
               GO TO LIVE PAGE
            ================================================= */

            window.location.href =
                `live.html?streamId=${encodeURIComponent(
                    streamRef.id
                )}`;


        } catch (error) {

            console.error(
                "❌ Unable to start stream:",
                error
            );


            alert(
                "Unable to start your live stream."
            );


            startLiveBtn.disabled =
                false;

            startLiveBtn.textContent =
                "🔴 Start Live";

        }

    }
);
