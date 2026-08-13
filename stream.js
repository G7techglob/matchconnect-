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

        if (snapshot.empty) {

            noLiveStreams.style.display = "block";

            return;
        }

        noLiveStreams.style.display = "none";


        snapshot.forEach((docSnap) => {

            const stream = docSnap.data();

            const streamId = docSnap.id;

            const card = document.createElement("div");

            card.className = "live-card";

            card.innerHTML = `

                <div class="live-preview">

                    ${
                        stream.hostPhoto
                        ?
                        `<img
                            src="${escapeHTML(stream.hostPhoto)}"
                            alt="Live stream"
                        >`
                        :
                        `<i
                            class="fa-solid fa-video"
                            style="color:white;font-size:40px;"
                        ></i>`
                    }

                    <span class="live-badge">
                        LIVE
                    </span>

                    <span class="viewer-count">
                        <i class="fa-solid fa-eye"></i>
                        ${stream.viewerCount || 0}
                    </span>

                </div>


                <div class="live-info">

                    <h4>
                        ${escapeHTML(stream.title || "Live Stream")}
                    </h4>

                    <div class="live-user">

                        <img
                            src="${escapeHTML(
                                stream.hostPhoto ||
                                "default-profile.png"
                            )}"
                            alt=""
                        >

                        <span>
                            ${escapeHTML(
                                stream.hostName ||
                                "MatchConnect User"
                            )}
                        </span>

                    </div>

                </div>
            `;


            card.addEventListener("click", () => {

                window.location.href =
                    `watch-live.html?streamId=${encodeURIComponent(streamId)}`;

            });


            liveStreams.appendChild(card);

        });

    },

    (error) => {

        console.error(
            "Error loading live streams:",
            error
        );

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
