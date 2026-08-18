import { auth, db } from "./firebase.js";

import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


console.log("✅ Streaming JS loaded");


const liveStreams = document.getElementById("liveStreams");
const noLiveStreams = document.getElementById("noLiveStreams");

const liveTab = document.getElementById("liveTab");
const videoTab = document.getElementById("videoTab");

const liveSection = document.getElementById("liveSection");
const videoSection = document.getElementById("videoSection");


/* =====================================================
   TABS
===================================================== */

liveTab.addEventListener("click", () => {

    liveTab.classList.add("active");
    videoTab.classList.remove("active");

    liveSection.style.display = "block";
    videoSection.style.display = "none";

});


videoTab.addEventListener("click", () => {

    videoTab.classList.add("active");
    liveTab.classList.remove("active");

    liveSection.style.display = "none";
    videoSection.style.display = "block";

});
/* =====================================================
   LOAD LIVE STREAMS
===================================================== */

const streamsQuery = query(
    collection(db, "liveStreams"),
    where("status", "==", "live"),
    orderBy("createdAt", "desc")
);


onSnapshot(
    streamsQuery,

    (snapshot) => {

        liveStreams.innerHTML = "";


        // =============================================
        // NOBODY IS LIVE
        // =============================================

        if (snapshot.empty) {

            noLiveStreams.style.display = "block";

            noLiveStreams.textContent =
                "Nobody is live right now.";

            return;
        }


        // =============================================
        // SOMEONE IS LIVE
        // =============================================

        noLiveStreams.style.display = "none";


        snapshot.forEach(
            (docSnap) => {

                const stream =
                    docSnap.data();

                const streamId =
                    docSnap.id;


                // =====================================
                // CREATE LIVE CARD
                // =====================================

                const card =
                    document.createElement("div");

                card.className =
                    "live-card";


                // =====================================
                // HOST PHOTO
                // =====================================

                const hostPhoto =
                    stream.hostPhoto ||
                    "default-profile.png";


                // =====================================
                // HOST NAME
                // =====================================

                const hostName =
                    stream.hostName ||
                    "MatchConnect User";


                // =====================================
                // STREAM TITLE
                // =====================================

                const streamTitle =
                    stream.title ||
                    "Live Stream";


                // =====================================
                // VIEWER COUNT
                // =====================================

                const viewers =
                    stream.viewerCount || 0;


                // =====================================
                // CARD HTML
                // =====================================

                card.innerHTML = `

                    <div class="live-preview">

                        <img
                            src="${escapeHTML(hostPhoto)}"
                            alt="${escapeHTML(hostName)}"
                            onerror="this.src='default-profile.png'"
                        >

                        <span class="live-badge">
                            🔴 LIVE
                        </span>

                        <span class="viewer-count">

                            <i class="fa-solid fa-eye"></i>

                            ${viewers}

                        </span>

                    </div>


                    <div class="live-info">

                        <h4>
                            ${escapeHTML(streamTitle)}
                        </h4>


                        <div class="live-user">

                            <img
                                src="${escapeHTML(hostPhoto)}"
                                alt=""
                                onerror="this.src='default-profile.png'"
                            >

                            <span>
                                ${escapeHTML(hostName)}
                            </span>

                        </div>

                    </div>

                `;


                // =====================================
                // OPEN LIVE
                // =====================================

                card.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            `watch-live.html?streamId=${encodeURIComponent(streamId)}`;

                    }
                );


                // =====================================
                // ADD CARD TO PAGE
                // =====================================

                liveStreams.appendChild(
                    card
                );

            }
        );

    },


    (error) => {

        console.error(
            "❌ Error loading live streams:",
            error
        );

    }

);

/* =====================================================
   LOAD SAVED LIVE VIDEOS
===================================================== */

const videoFeed =
    document.getElementById("videoFeed");


const savedVideosQuery = query(
    collection(db, "liveStreams"),
    where("status", "==", "ended"),
    orderBy("endedAt", "desc")
);


onSnapshot(
    savedVideosQuery,

    (snapshot) => {

        videoFeed.innerHTML = "";


        // =============================================
        // NO SAVED VIDEOS
        // =============================================

        if (snapshot.empty) {

            videoFeed.innerHTML = `

                <p class="empty-message">

                    No saved live videos yet.

                </p>

            `;

            return;
        }


        // =============================================
        // DISPLAY SAVED VIDEOS
        // =============================================

        snapshot.forEach(
            (docSnap) => {

                const stream =
                    docSnap.data();

                const streamId =
                    docSnap.id;


                const title =
                    stream.title ||
                    "Live Stream";


                const hostName =
                    stream.hostName ||
                    "MatchConnect User";


                const hostPhoto =
                    stream.hostPhoto ||
                    "default-profile.png";


                // =====================================
                // VIDEO CARD
                // =====================================

                const card =
                    document.createElement("div");

                card.className =
                    "video-card";


                card.innerHTML = `

                    <div class="video-thumbnail">

                        <img
                            src="${escapeHTML(hostPhoto)}"
                            alt="${escapeHTML(hostName)}"
                            onerror="this.src='default-profile.png'"
                        >

                        <span class="play-icon">

                            <i class="fa-solid fa-play"></i>

                        </span>

                    </div>


                    <div class="video-info">

                        <h4>
                            ${escapeHTML(title)}
                        </h4>

                        <div class="video-user">

                            <img
                                src="${escapeHTML(hostPhoto)}"
                                alt=""
                                onerror="this.src='default-profile.png'"
                            >

                            <span>
                                ${escapeHTML(hostName)}
                            </span>

                        </div>

                    </div>

                `;


                // =====================================
                // OPEN SAVED VIDEO
                // =====================================

                card.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            `watch-live.html?streamId=${encodeURIComponent(streamId)}&recorded=true`;

                    }
                );


                videoFeed.appendChild(
                    card
                );

            }
        );

    },


    (error) => {

        console.error(
            "❌ Error loading saved live videos:",
            error
        );

        videoFeed.innerHTML = `

            <p class="empty-message">

                Unable to load saved videos.

            </p>

        `;

    }

);
/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

                      }
