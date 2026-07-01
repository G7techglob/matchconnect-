import { db } from "./firebase.js";
import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const videoFeed = document.getElementById("videoFeed");

const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {

    videoFeed.innerHTML = "";

    snapshot.forEach(doc => {
        const post = doc.data();

        // ONLY show posts that have video
        if (post.video) {

            const div = document.createElement("div");
            div.classList.add("video-post");

            div.innerHTML = `
                <video controls src="${post.video}"></video>
                <p>${post.text || ""}</p>
            `;

            videoFeed.appendChild(div);
        }
    });
});
