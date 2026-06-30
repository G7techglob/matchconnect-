import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const reelsContainer = document.getElementById("reelsContainer");

async function loadReels() {
    reelsContainer.innerHTML = "";

    const querySnapshot = await getDocs(collection(window.db, "reels"));

    querySnapshot.forEach((doc) => {
        const reel = doc.data();

        const reelDiv = document.createElement("div");
        reelDiv.className = "reel";

        reelDiv.innerHTML = `
            <video src="${reel.videoUrl}" muted loop playsinline></video>
            <div class="reel-info">
                <h4>${reel.username || "User"}</h4>
                <p>${reel.caption || ""}</p>
            </div>
        `;

        reelsContainer.appendChild(reelDiv);
    });
}

loadReels();
