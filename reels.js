import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const reelsContainer = document.getElementById("reelsContainer");
const uploadBtn = document.getElementById("uploadReelBtn");

async function loadReels() {
    reelsContainer.innerHTML = "";

    const querySnapshot = await getDocs(collection(window.db, "reels"));

    querySnapshot.forEach((doc) => {
        const reel = doc.data();

        const div = document.createElement("div");
        div.className = "reel";

        div.innerHTML = `
            <video src="${reel.videoUrl}" muted loop playsinline></video>
            <div class="reel-info">
                <h4>${reel.username || "User"}</h4>
                <p>${reel.caption || ""}</p>
            </div>
        `;

        reelsContainer.appendChild(div);
    });
}

uploadBtn.addEventListener("click", async () => {
    const file = document.getElementById("reelFile").files[0];
    const caption = document.getElementById("reelCaption").value;

    if (!file) {
        alert("Select a video first");
        return;
    }

    const storageRef = ref(window.storage, "reels/" + Date.now() + file.name);

    await uploadBytes(storageRef, file);

    const videoUrl = await getDownloadURL(storageRef);

    await addDoc(collection(window.db, "reels"), {
        videoUrl,
        caption,
        username: "Anonymous",
        createdAt: serverTimestamp()
    });

    alert("Reel uploaded!");

    loadReels();
});

loadReels();
