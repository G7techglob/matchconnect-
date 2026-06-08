import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { auth } from "./firebase.js";

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

// UI ELEMENTS
let postBtn;
let postContent;
let postsContainer;

// INIT AFTER PAGE LOAD
window.addEventListener("DOMContentLoaded", () => {

  postBtn = document.getElementById("postBtn");
  postContent = document.getElementById("postContent");
  postsContainer = document.getElementById("postsContainer");

  if (!postBtn || !postContent || !postsContainer) {
    console.error("Missing HTML elements for posts system");
    return;
  }

  setupFeed();
  setupPosting();

});

// REALTIME FEED
function setupFeed() {

  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {

    postsContainer.innerHTML = "";

    snapshot.forEach((postDoc) => {

      const post = postDoc.data();

      const div = document.createElement("div");
      div.className = "post";

      div.innerHTML = `

<div class="post-header">

  <img
    src="${post.photoURL || 'images/default-avatar.png'}"
    class="post-avatar"
  >

  <span class="post-user">
    ${post.username || "User"}
  </span>

</div>

<p>
  ${escapeHTML(post.content || "")}
</p>

<div class="post-actions">

  <button class="like-btn">
    ❤️ ${post.likes || 0}
  </button>

  <button class="comment-btn">
    💬 Comment
  </button>

  <button class="share-btn">
    🔄 Share
  </button>

</div>

`;

      postsContainer.appendChild(div);

    });

  }, (error) => {

    console.error("Feed error:", error);

  });

}

// CREATE POST
function setupPosting() {

  postBtn.addEventListener("click", async () => {

    const content = postContent.value.trim();

    if (!content) return;

    try {

      const user = auth.currentUser;

      if (!user) {
        alert("Please login first");
        return;
      }

      await addDoc(collection(db, "posts"), {
        content: content,
        userId: user.uid,
        username: user.displayName || user.email,
        photoURL: user.photoURL || "images/default-avatar.png",
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp()
      });

      postContent.value = "";

    } catch (error) {

      console.error("Post error:", error);

    }

  });

}

// SECURITY
function escapeHTML(str) {

  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

        }
