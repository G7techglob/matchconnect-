import { db } from "./firebase.js";
import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const videoFeed = document.getElementById("videoFeed");

const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
);

onSnapshot(q, (snapshot) => {

    videoFeed.innerHTML = "";

    snapshot.forEach(doc => {

        const post = doc.data();

        if (!post.media) return;

        const video = post.media.find(
            item => item.type === "video"
        );

        if (!video) return;

        const div = document.createElement("div");

        div.className = "video-post";

        div.innerHTML = `
            <video controls src="${video.url}"></video>

            <p>${post.content || ""}</p>
        `;

        videoFeed.appendChild(div);

    });

});
