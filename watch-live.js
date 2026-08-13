import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    onSnapshot,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


console.log("✅ Watch Live JS loaded");


// =====================================================
// GET STREAM ID
// =====================================================

const params =
    new URLSearchParams(
        window.location.search
    );

const streamId =
    params.get("streamId");


// =====================================================
// ELEMENTS
// =====================================================

const remoteVideo =
    document.getElementById("remoteVideo");

const title =
    document.getElementById("title");

const streamTitle =
    document.getElementById("streamTitle");

const viewerCount =
    document.getElementById("viewerCount");

const hostInfo =
    document.getElementById("hostInfo");

const chatMessages =
    document.getElementById("chatMessages");

const chatInput =
    document.getElementById("chatInput");

const sendChatBtn =
    document.getElementById("sendChatBtn");

const likeBtn =
    document.getElementById("likeBtn");

const shareBtn =
    document.getElementById("shareBtn");


// =====================================================
// VARIABLES
// =====================================================

let peerConnection = null;

let viewerId = null;

let currentUser = null;

let viewerCountAdded = false;

let streamEnded = false;


// =====================================================
// WEBRTC CONFIGURATION
// =====================================================

const rtcConfig = {

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
// CHECK STREAM ID
// =====================================================

if (!streamId) {

    alert(
        "Live stream not found."
    );

    window.location.href =
        "stream.html";

}


// =====================================================
// AUTH
// =====================================================

auth.onAuthStateChanged(
    async user => {

        if (!user) {

            alert(
                "Please log in to watch this live stream."
            );

            return;

        }


        currentUser =
            user;

        viewerId =
            user.uid;


        try {

            await loadStream();

            await joinLive();

            listenForChat();

        } catch (error) {

            console.error(
                "Watch Live startup error:",
                error
            );

        }

    }
);


// =====================================================
// LOAD STREAM
// =====================================================

async function loadStream() {

    const streamRef =
        doc(
            db,
            "liveStreams",
            streamId
        );


    const streamSnap =
        await getDoc(
            streamRef
        );


    if (!streamSnap.exists()) {

        alert(
            "This live stream does not exist."
        );

        return;

    }


    const stream =
        streamSnap.data();


    if (
        stream.status !== "live"
    ) {

        alert(
            "This live stream has ended."
        );

        streamEnded =
            true;

        return;

    }


    const streamName =
        stream.title ||
        "MatchConnect Live";


    title.textContent =
        streamName;

    streamTitle.textContent =
        streamName;


    viewerCount.textContent =
        stream.viewerCount || 0;


    hostInfo.textContent =
        stream.hostName ||
        "MatchConnect User";


    // Update likes if available

    const likes =
        stream.likes || 0;


    likeBtn.innerHTML =
        `❤️ <span>${likes}</span>`;

}


// =====================================================
// JOIN LIVE
// =====================================================

async function joinLive() {

    if (streamEnded) {
        return;
    }


    console.log(
        "📡 Joining live stream..."
    );


    peerConnection =
        new RTCPeerConnection(
            rtcConfig
        );


    // =================================================
    // RECEIVE HOST MEDIA
    // =================================================

    peerConnection.ontrack =
        event => {

            console.log(
                "🎥 Host media received"
            );


            if (
                event.streams &&
                event.streams[0]
            ) {

                remoteVideo.srcObject =
                    event.streams[0];


                remoteVideo.play()
                    .catch(
                        error => {

                            console.log(
                                "Video play waiting for user interaction:",
                                error
                            );

                        }
                    );

            }

        };


    // =================================================
    // VIEWER ICE CANDIDATE
    // =================================================

    peerConnection.onicecandidate =
        async event => {

            if (
                !event.candidate
            ) {

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

            } catch (error) {

                console.error(
                    "Viewer ICE error:",
                    error
                );

            }

        };


    // =================================================
    // CONNECTION STATE
    // =================================================

    peerConnection.onconnectionstatechange =
        () => {

            console.log(
                "WebRTC connection:",
                peerConnection.connectionState
            );


            if (
                peerConnection.connectionState ===
                "failed"
            ) {

                console.error(
                    "WebRTC connection failed."
                );

            }


            if (
                peerConnection.connectionState ===
                "disconnected"
            ) {

                console.log(
                    "Viewer disconnected."
                );

            }

        };


    // =================================================
    // CREATE OFFER
    // =================================================

    const offer =
        await peerConnection.createOffer({

            offerToReceiveAudio:
                true,

            offerToReceiveVideo:
                true

        });


    await peerConnection.setLocalDescription(
        offer
    );


    // =================================================
    // SAVE OFFER
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

            type:
                offer.type,

            sdp:
                offer.sdp,

            viewerId:
                viewerId,

            createdAt:
                serverTimestamp()

        }
    );


    console.log(
        "📤 Viewer offer sent"
    );


    // =================================================
    // LISTEN FOR HOST ANSWER
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
        async snapshot => {

            if (
                !snapshot.exists()
            ) {

                return;

            }


            const data =
                snapshot.data();


            if (
                !data.answer
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

                await peerConnection
                    .setRemoteDescription(
                        new RTCSessionDescription(
                            data.answer
                        )
                    );


                console.log(
                    "📥 Host answer received"
                );


            } catch (error) {

                console.error(
                    "Remote description error:",
                    error
                );

            }

        }
    );


    // =================================================
    // INCREASE VIEWER COUNT
    // =================================================

    if (
        !viewerCountAdded
    ) {

        viewerCountAdded =
            true;


        try {

            await updateDoc(

                doc(
                    db,
                    "liveStreams",
                    streamId
                ),

                {

                    viewerCount:
                        increment(1)

                }

            );


        } catch (error) {

            console.error(
                "Viewer count error:",
                error
            );

        }

    }

}


// =====================================================
// LIVE CHAT
// =====================================================

function listenForChat() {

    const commentsRef =
        collection(
            db,
            "liveStreams",
            streamId,
            "comments"
        );


    onSnapshot(
        commentsRef,
        snapshot => {

            chatMessages.innerHTML =
                "";


            snapshot.forEach(
                commentDoc => {

                    const comment =
                        commentDoc.data();


                    const message =
                        document.createElement(
                            "div"
                        );


                    message.className =
                        "chat-message";


                    const username =
                        escapeHTML(
                            comment.username ||
                            "User"
                        );


                    const text =
                        escapeHTML(
                            comment.text ||
                            ""
                        );


                    message.innerHTML = `

                        <strong>
                            ${username}
                        </strong>

                        <span>
                            ${text}
                        </span>

                    `;


                    chatMessages.appendChild(
                        message
                    );

                }
            );


            chatMessages.scrollTop =
                chatMessages.scrollHeight;

        }
    );

}


// =====================================================
// SEND CHAT
// =====================================================

sendChatBtn.addEventListener(
    "click",
    sendChat
);


chatInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            event.preventDefault();

            sendChat();

        }

    }
);


async function sendChat() {

    const text =
        chatInput.value.trim();


    if (!text) {
        return;
    }


    if (!currentUser) {
        return;
    }


    try {

        await addDoc(

            collection(
                db,
                "liveStreams",
                streamId,
                "comments"
            ),

            {

                userId:
                    currentUser.uid,

                username:
                    currentUser.displayName ||
                    currentUser.email ||
                    "User",

                photoURL:
                    currentUser.photoURL ||
                    "",

                text:
                    text,

                createdAt:
                    serverTimestamp()

            }

        );


        chatInput.value =
            "";


    } catch (error) {

        console.error(
            "Send chat error:",
            error
        );


        alert(
            "Unable to send message."
        );

    }

}


// =====================================================
// LIKE
// =====================================================

likeBtn.addEventListener(
    "click",
    async () => {

        if (!currentUser) {
            return;
        }


        try {

            await updateDoc(

                doc(
                    db,
                    "liveStreams",
                    streamId
                ),

                {

                    likes:
                        increment(1)

                }

            );


            likeBtn.disabled =
                true;


            likeBtn.innerHTML =
                "❤️ Liked";


        } catch (error) {

            console.error(
                "Like error:",
                error
            );

        }

    }
);


// =====================================================
// SHARE
// =====================================================

shareBtn.addEventListener(
    "click",
    async () => {

        const shareURL =
            window.location.href;


        try {

            if (
                navigator.share
            ) {

                await navigator.share({

                    title:
                        title.textContent,

                    text:
                        "Watch this live stream on MatchConnect!",

                    url:
                        shareURL

                });

            } else {

                await navigator.clipboard.writeText(
                    shareURL
                );


                alert(
                    "Live stream link copied!"
                );

            }

        } catch (error) {

            console.log(
                "Share cancelled."
            );

        }

    }
);


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    value = ""
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// =====================================================
// CLEANUP
// =====================================================

window.addEventListener(
    "beforeunload",
    async () => {

        if (
            peerConnection
        ) {

            peerConnection.close();

        }


        if (
            !viewerCountAdded
        ) {

            return;

        }


        try {

            await updateDoc(

                doc(
                    db,
                    "liveStreams",
                    streamId
                ),

                {

                    viewerCount:
                        increment(-1)

                }

            );

        } catch (error) {

            console.error(
                "Viewer cleanup error:",
                error
            );

        }

    }
);
