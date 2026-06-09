import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  deleteDoc,
  setDoc,
getDoc
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

  <button class="like-btn"
  data-id="${postDoc.id}">
    ❤️ ${post.likes || 0}
  </button>

  <button
  class="comment-btn"
  data-id="${postDoc.id}">
  💬 Comment
</button>

  <button class="share-btn">
    🔄 Share
  </button>

   ${
    auth.currentUser &&
    auth.currentUser.uid === post.userId
      ? `<button class="delete-btn" data-id="${postDoc.id}">
           🗑 Delete
         </button>`
      : ""
   }
   </div>

<div class="comment-section">

  <input
    type="text"
    class="comment-input"
    data-id="${postDoc.id}"
    placeholder="Write a comment..."
  >

  <button
    class="send-comment-btn"
    data-id="${postDoc.id}">
    Send
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

document.addEventListener("click", async (e) => {

  if (!e.target.classList.contains("like-btn")) return;

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first");
    return;
  }

  const postId = e.target.dataset.id;

  const likeRef = doc(
    db,
    "posts",
    postId,
    "likes",
    user.uid
  );

  try {

    const existingLike = await getDoc(likeRef);

    if (existingLike.exists()) {

      await deleteDoc(likeRef);

      await updateDoc(
        doc(db, "posts", postId),
        {
          likes: increment(-1)
        }
      );

    } else {

      await setDoc(likeRef, {
        userId: user.uid,
        createdAt: Date.now()
      });

      await updateDoc(
        doc(db, "posts", postId),
        {
          likes: increment(1)
        }
      );

    }

  } catch (error) {

    console.error(
      "Like error:",
      error
    );

  }

});

document.addEventListener("click", async (e) => {

  if (!e.target.classList.contains("delete-btn")) return;

  console.log("DELETE CLICKED");

  const postId = e.target.dataset.id;

  console.log("POST ID:", postId);

  const confirmed = confirm(
    "Are you sure you want to delete this post?"
  );

  if (!confirmed) {
    console.log("DELETE CANCELLED");
    return;
  }

  try {

    console.log("ATTEMPTING DELETE");

    await deleteDoc(
      doc(db, "posts", postId)
    );

    console.log("DELETE SUCCESS");

  } catch (error) {

    console.error(
      "DELETE ERROR:",
      error
    );

  }

});

document.addEventListener("click", async (e) => {

  if (!e.target.classList.contains("send-comment-btn")) return;

  console.log("COMMENT BUTTON CLICKED");

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first");
    return;
  }

  const postId = e.target.dataset.id;

  console.log("POST ID:", postId);

  const input = document.querySelector(
    `.comment-input[data-id="${postId}"]`
  );

  const text = input.value.trim();

  console.log("COMMENT TEXT:", text);

  if (!text) return;

  try {

    await addDoc(
      collection(db, "posts", postId, "comments"),
      {
        text,
        userId: user.uid,
        username: user.displayName || user.email,
        createdAt: serverTimestamp()
      }
    );

    console.log("COMMENT SAVED");

    input.value = "";

    await updateDoc(
      doc(db, "posts", postId),
      {
        comments: increment(1)
      }
    );

  } catch (error) {

    console.error("COMMENT ERROR:", error);

  }

});

// SECURITY
function escapeHTML(str) {

  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
