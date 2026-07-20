import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyCVdy9nJLp3YDV9PNB9kfR3HiQCdFdvGmg",
  authDomain: "matchconnect-44a3e.firebaseapp.com",
  projectId: "matchconnect-44a3e",
  storageBucket: "matchconnect-44a3e.firebasestorage.app",
  messagingSenderId: "283382943870",
  appId: "1:283382943870:web:ee1d08c65bcbac400cc82f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Move ALL of your existing followers loading code here.
});

const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");

if (!uid) {
  alert("No UID received");
  throw new Error("UID is missing");
}

const container = document.getElementById("followersList");
const totalEl = document.getElementById("followersTotal");

container.innerHTML = "";

try {
  const followersSnapshot = await getDocs(
    collection(db, "users", uid, "followers")
  );

  totalEl.textContent = followersSnapshot.size;

  if (followersSnapshot.empty) {
    container.innerHTML = "<p>No followers yet.</p>";
  } else {
    for (const followerDoc of followersSnapshot.docs) {
      try {
        const followerId = followerDoc.data().userId || followerDoc.id;

        const userSnap = await getDoc(doc(db, "users", followerId));

        if (!userSnap.exists()) {
          console.log("User not found:", followerId);
          continue;
        }

        const user = userSnap.data();

        const card = document.createElement("div");
        card.className = "user-card";

        card.innerHTML = `
          <img
            src="${user.photoURL || "images/default-avatar.png"}"
            width="50"
            height="50"
          >
          <a href="user.html?uid=${followerId}">
            ${user.name || "User"}
          </a>
        `;

        container.appendChild(card);

      } catch (err) {
        console.error("Error loading follower:", err);
      }
    }
  }
} 
catch (err) {
  console.error("Followers error:", err);
  alert(err.message);
  container.innerHTML = `<p>${err.message}</p>`;
}
