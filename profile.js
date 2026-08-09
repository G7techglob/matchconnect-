import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  increment,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// TODO: Move this to environment variables for security
// Never commit API keys to version control
const firebaseConfig = {
  apiKey: "AIzaSyCVdy9nJLp3YDV9PNB9kfR3HiQCdFdvGmg",
  authDomain: "matchconnect-44a3e.firebaseapp.com",
  projectId: "matchconnect-44a3e",
  storageBucket: "matchconnect-44a3e.firebasestorage.app",
  messagingSenderId: "283382943870",
  appId: "1:283382943870:web:ee1d08c65bcbac400cc82f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== UTILITY FUNCTIONS ====================

/**
 * Sanitize text to prevent XSS attacks
 * @param {string} text - Raw text to sanitize
 * @returns {string} - Escaped text safe for innerHTML
 */
function sanitizeText(text = "") {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

/**
 * Show notification with optional error styling
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether to show as error
 */
function showNotification(message, isError = false) {
  const notif = document.createElement("div");
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10000;
    font-weight: 500;
    animation: slideIn 0.3s ease;
    background-color: ${isError ? "#ff6b6b" : "#51cf66"};
    color: white;
  `;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

function safeImageUrl(url, fallback = "images/default-avatar.png") {
  if (!url || typeof url !== "string") return fallback;

  const trimmed = url.trim();
  if (!trimmed) return fallback;

  try {
    const parsed = new URL(trimmed, window.location.origin);
    const allowedProtocols = ["http:", "https:"];
    return allowedProtocols.includes(parsed.protocol) ? parsed.href : fallback;
  } catch {
    return fallback;
  }
}

// ==================== INITIALIZE PROFILE ====================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      showNotification("User profile not found", true);
      return;
    }
    const data = userSnap.data();

    const followersSnap = await getDocs(collection(db, "users", user.uid, "followers"));
    const followingSnap = await getDocs(collection(db, "users", user.uid, "following"));

    const followersCount = document.getElementById("followersCount");
    const followingCount = document.getElementById("followingCount");

    if (followersCount) followersCount.textContent = String(followersSnap.size);
    if (followingCount) followingCount.textContent = String(followingSnap.size);

    const followersLink = document.getElementById("followersLink");
    const followingLink = document.getElementById("followingLink");

    if (followersLink) followersLink.href = `followers.html?uid=${user.uid}`;
    if (followingLink) followingLink.href = `following.html?uid=${user.uid}`;

    // Use textContent instead of innerHTML to prevent XSS
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profileBio = document.getElementById("profileBio");
    const profilePhoto = document.getElementById("profilePhoto");
    const editName = document.getElementById("editName");
    const editBio = document.getElementById("editBio");
    const photoURLInput = document.getElementById("photoURLInput");

    if (profileName) profileName.textContent = data.name || "No Name";
    if (profileEmail) profileEmail.textContent = data.email || user.email || "No Email";
    if (profileBio) profileBio.textContent = data.bio || "No bio yet";
    if (profilePhoto) profilePhoto.src = safeImageUrl(data.photoURL);
    if (editName) editName.value = data.name || "";
    if (editBio) editBio.value = data.bio || "";
    if (photoURLInput) photoURLInput.value = data.photoURL || "";

console.log("Loading post count...");
await loadPostCount(user);

console.log("Loading my posts...");
await loadMyPosts(user);

console.log("Loading following posts...");
await loadFollowingPosts();

console.log("Finished loading posts.");
    
    const viewMedia = document.getElementById("viewMedia");
    if (viewMedia) {
      viewMedia.onclick = () => {
        location.href = `media.html?uid=${user.uid}`;
      };
    }

const photosTab = document.getElementById("photosTab");
const reelsTab = document.getElementById("reelsTab");
const postsTab = document.getElementById("postsTab");

if (photosTab) {
  photosTab.onclick = () => {
    window.location.href = `photos.html?uid=${user.uid}`;
  };
}

if (reelsTab) {
  reelsTab.onclick = () => {
    window.location.href = `reels.html?uid=${user.uid}`;
  };
}

if (postsTab) {
  postsTab.onclick = () => {
    const postsEl = document.getElementById("myPosts");
    const mediaContainer = document.getElementById("mediaContainer");

    if (postsEl) postsEl.style.display = "block";
    if (mediaContainer) mediaContainer.innerHTML = "";
  };
}
    
  } catch (error) {
    console.error("Error loading profile:", error);
    showNotification("Error loading profile: " + error.message, true);
  }
});

// ==================== PROFILE SAVE HANDLER ====================

const saveBtn = document.getElementById("saveProfileBtn");
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;

    const name = document.getElementById("editName")?.value.trim() || "";
    const bio = document.getElementById("editBio")?.value.trim() || "";
    const photoURL = document.getElementById("photoURLInput")?.value.trim() || "";

    try {
      await updateDoc(doc(db, "users", user.uid), {
        name,
        bio,
        photoURL
      });

      showNotification("Profile updated successfully!");
      setTimeout(() => location.reload(), 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      showNotification("Error updating profile: " + error.message, true);
    }
  });
}

// ==================== CREATE POST HANDLER ====================

const profilePostBtn = document.getElementById("profilePostBtn");
if (profilePostBtn) {
  profilePostBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      showNotification("Please login", true);
      return;
    }

    const content = document.getElementById("profilePostContent")?.value.trim() || "";
    if (!content) {
      showNotification("Write something first", true);
      return;
    }

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const profileData = userSnap.data() || {};

      await addDoc(collection(db, "posts"), {
        content,
        userId: user.uid,
        username: profileData.name || user.email || "User",
        photoURL: safeImageUrl(profileData.photoURL),
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp()
      });

      showNotification("Post created!");
      const postContent = document.getElementById("profilePostContent");
      if (postContent) postContent.value = "";
      await loadMyPosts(user);
    } catch (error) {
      console.error("Error creating post:", error);
      showNotification("Error creating post: " + error.message, true);
    }
  });
}

// ==================== LOAD POST COUNT ====================
async function loadPostCount(user) {
  const postCount = document.getElementById("postCount");

  if (!postCount) {
    console.log("postCount element NOT FOUND");
    return;
  }

  try {
    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(postsQuery);

    postCount.textContent = String(snapshot.size);

    console.log("My post count:", snapshot.size);

  } catch (error) {
    console.error("Error loading post count:", error);
    postCount.textContent = "0";
  }
}
// ==================== LOAD POSTS ====================
async function loadMyPosts(user) {
  console.log("STEP 1: loadMyPosts started");

  const myPosts = document.getElementById("myPosts");

  if (!myPosts) {
    console.log("STEP 2: myPosts element NOT FOUND");
    return;
  }

  myPosts.innerHTML = "";

  try {
    console.log("STEP 3: Querying posts for UID:", user.uid);

    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(postsQuery);

    console.log("STEP 4: Posts found:", snapshot.size);

    if (snapshot.empty) {
      myPosts.innerHTML = `
        <p class="no-posts">You haven't posted anything yet.</p>
      `;
      return;
    }

    snapshot.forEach((postDoc) => {
      console.log("STEP 5: Rendering post:", postDoc.id);

      renderPost(postDoc);
    });

    console.log("STEP 6: Finished loading my posts");

  } catch (error) {
    console.error("STEP ERROR: loadMyPosts failed:", error);
  }
}


async function loadFollowingPosts() {

  const container = document.getElementById("followingPosts");

  if (!container) return;

  container.innerHTML = "";

  const user = auth.currentUser;

  if (!user) return;


  try {

    const followingSnap = await getDocs(
      collection(db, "users", user.uid, "following")
    );


    if (followingSnap.empty) {

      container.innerHTML = "Not following anyone yet";

      return;

    }


    let followingIds = [];


    followingSnap.forEach((doc)=>{

      followingIds.push(doc.id);

    });



    const postsSnap = await getDocs(
      collection(db,"posts")
    );


    postsSnap.forEach((postDoc)=>{

      const post = postDoc.data();


      if(followingIds.includes(post.userId)){


        const div = document.createElement("div");

        div.className = "post-container";


        div.innerHTML = `

        <div class="post-header">

        <img 
        src="${safeImageUrl(post.photoURL)}"
        class="post-avatar">

        <strong>
        ${sanitizeText(post.username || "User")}
        </strong>

        </div>


        <p class="post-content">
        ${sanitizeText(post.content || "")}
        </p>


        <hr>

        `;


        container.appendChild(div);


      }


    });


  } catch(error){

    console.error(
      "Error loading following posts:",
      error
    );

  }

    }

/**
 * Render a single post
 */
async function renderPost(postDoc) {

  const myPosts = document.getElementById("myPosts");

  if (!myPosts) return;

  const post = postDoc.data();

  if (post.userId !== auth.currentUser?.uid) return;

  const div = document.createElement("div");

  div.className = "post-container";

  div.setAttribute("data-post-id", postDoc.id);

  const sanitizedUsername =
    sanitizeText(post.username || "User");

  const sanitizedContent =
    sanitizeText(post.content || "");

  const photoURL =
    safeImageUrl(post.photoURL);

  div.innerHTML = `

    <div class="post-header">

      <img
        src="${photoURL}"
        class="post-avatar"
        width="40"
        alt="User avatar"
        onerror="this.src='images/default-avatar.png'"
      >

      <strong>
        ${sanitizedUsername}
      </strong>

      <br>

      <small>
        ${
          post.createdAt?.seconds
            ? new Date(
                post.createdAt.seconds * 1000
              ).toLocaleString()
            : ""
        }
      </small>

    </div>

    <p class="post-content">
      ${sanitizedContent}
    </p>

    ${
      post.imageURL
        ? `
          <img
            src="${safeImageUrl(post.imageURL)}"
            class="post-image"
            alt="Post image"
          >
        `
        : ""
    }

    <div class="post-actions">

      <button
        class="like-btn"
        data-id="${postDoc.id}"
      >
        ❤️
        <span class="like-count">
          ${post.likes || 0}
        </span>
      </button>

      <button
        class="comment-btn"
        data-id="${postDoc.id}"
      >
        💬
        <span class="comment-count">
          ${post.comments || 0}
        </span>
      </button>

      <button
        class="share-btn"
        data-id="${postDoc.id}"
        title="Share"
      >
        🔄
      </button>

      <button
        class="delete-btn"
        data-id="${postDoc.id}"
        title="Delete"
      >
        🗑
      </button>

    </div>

  `;

  myPosts.appendChild(div);
}

// ==================== EVENT DELEGATOR ====================

document.addEventListener("click", async (e) => {

  const target = e.target.closest("button");

  if (!target) return;

  const postId = target.dataset.id;

  if (!postId) return;


  // ====================
  // OPEN COMMENTS PAGE
  // ====================

  if (target.classList.contains("comment-btn")) {

    window.location.href =
      `comments.html?postId=${postId}`;

    return;
  }


  // ====================
  // DELETE POST
  // ====================

  if (target.classList.contains("delete-btn")) {

    await handleDeletePost(postId);

    return;
  }


  // ====================
  // SHARE POST
  // ====================

  if (target.classList.contains("share-btn")) {

    handleSharePost(postId);

    return;
  }


  // ====================
  // LIKE POST
  // ====================

  if (target.classList.contains("like-btn")) {

    await handleLikePost(postId);

    return;
  }

});

// ==================== POST ACTIONS ====================

/**
 * Handle delete post action
 */
async function handleDeletePost(postId) {
  if (!confirm("Delete this post?")) return;

  try {
    await deleteDoc(doc(db, "posts", postId));
    showNotification("Post deleted");
    await loadMyPosts();
  } catch (error) {
    console.error("Error deleting post:", error);
    showNotification("Error deleting post: " + error.message, true);
  }
}

/**
 * Handle share post to WhatsApp
 */
function handleSharePost(postId) {
  const postLink = `https://g7techglob.github.io/matchconnect-/post.html?id=${postId}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(postLink)}`;
  window.open(whatsappUrl, "_blank");
}

  const input = document.querySelector(`.comment-input[data-id="${postId}"]`);
  if (!input) return;

  const text = input.value.trim();
  if (!text) {
    showNotification("Write a comment", true);
    return;
  }

  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const profileData = userSnap.data() || {};

    await addDoc(collection(db, "posts", postId, "comments"), {
      text,
      userId: user.uid,
      username: profileData.name || user.email || "User",
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "posts", postId), {
      comments: increment(1)
    });

    input.value = "";
    showNotification("Comment added!");
    await loadMyPosts(auth.currentUser);
  } catch (error) {
    console.error("Error adding comment:", error);
    showNotification("Error adding comment: " + error.message, true);
  }
}

/**
 * Handle like post action
 */
async function handleLikePost(postId) {
  const user = auth.currentUser;
  if (!user) {
    showNotification("Please login", true);
    return;
  }

  const likeRef = doc(db, "posts", postId, "likes", user.uid);

  try {
    const existingLike = await getDoc(likeRef);

    if (existingLike.exists()) {
      // Unlike
      await deleteDoc(likeRef);
      await updateDoc(doc(db, "posts", postId), {
        likes: increment(-1)
      });
    } else {
      // Like
      await setDoc(likeRef, {
        userId: user.uid
      });
      await updateDoc(doc(db, "posts", postId), {
        likes: increment(1)
      });
    }

    await loadMyPosts();
  } catch (error) {
    console.error("Error toggling like:", error);
    showNotification("Error toggling like: " + error.message, true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const settingsBtn = document.getElementById("settingsBtn");

  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      window.location.href = "settings.html";
    });
  }
});

const menuBtn = document.getElementById("menuBtn");
const profileMenu = document.getElementById("profileMenu");

// OPEN / CLOSE MENU
if (menuBtn && profileMenu) {
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle("show");
  });
}

// CLOSE WHEN CLICKING OUTSIDE
document.addEventListener("click", (e) => {
  if (
    profileMenu &&
    menuBtn &&
    !profileMenu.contains(e.target) &&
    !menuBtn.contains(e.target)
  ) {
    profileMenu.classList.remove("show");
  }
});
