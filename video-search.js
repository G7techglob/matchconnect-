import { db } from "./firebase.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const searchInput = document.getElementById("searchInput");
const results = document.getElementById("videoResults");

let videos = [];

// Load all videos
async function loadVideos() {
    const snapshot = await getDocs(collection(db, "posts"));

    videos = [];

    snapshot.forEach(doc => {
        const post = doc.data();

        if (post.video) {
            videos.push({
                id: doc.id,
                text: post.text || "",
                video: post.video
            });
        }
    });

    showResults(videos);
}

function showResults(list) {
    results.innerHTML = "";

    if (list.length === 0) {
        results.innerHTML = "<p>No videos found.</p>";
        return;
    }

    list.forEach(video => {
        const div = document.createElement("div");
        div.className = "video-post";

        div.innerHTML = `
            <video controls src="${video.video}"></video>
            <p>${video.text}</p>
        `;

        results.appendChild(div);
    });
}

searchInput.addEventListener("input", () => {

    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = videos.filter(video =>
        video.text.toLowerCase().includes(keyword)
    );

    showResults(filtered);

});

loadVideos();
