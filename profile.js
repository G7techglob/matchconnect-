import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged 
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

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
  where
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
function sanitizeText(text) {
  const div = document.createElement("div");
  div.textContent = text;
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

const followersSnap = await getDocs(
  query(
    collection(db, "followers"),
    where("userId", "==", user.uid)
  )
);

const followingSnap = await getDocs(
  query(
    collection(db, "following"),
    where("userId", "==", user.uid)
  )
);

const followersCount = document.getElementById("followersCount");
const followingCount = document.getElementById("followingCount");

if (followersCount) {
  followersCount.textContent = followersSnap.size;
}

if (followingCount) {
  followingCount.textContent = followingSnap.size;
}

    const followersLink =
  document.getElementById(
    "followersLink"
  );

const followingLink =
  document.getElementById(
    "followingLink"
  );

if (followersLink) {
  followersLink.href =
    `followers.html?uid=${user.uid}`;
}

if (followingLink) {
  followingLink.href =
    `following.html?uid=${user.uid}`;
}
    
    
    // Use textContent instead of innerHTML to prevent XSS
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profileBio = document.getElementById("profileBio");
    const profilePhoto = document.getElementById("profilePhoto");
    const editName = document.getElementById("editName");
    const editBio = document.getElementById("editBio");
    const photoURLInput = document.getElementById("photoURLInput");

    if (profileName) profileName.textContent = data.name || "No Name";
    if (profileEmail) profileEmail.textContent = data.email || user.email;
    if (profileBio) profileBio.textContent = data.bio || "No bio yet";
    if (profilePhoto) profilePhoto.src = data.photoURL || "images/default-avatar.png";
    if (editName) editName.value = data.name || "";
    if (editBio) editBio.value = data.bio || "";
    if (photoURLInput) photoURLInput.value = data.photoURL || "";

    await loadMyPosts();
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
      const profileData = userSnap.data();

      await addDoc(collection(db, "posts"), {
        content,
        userId: user.uid,
        username: profileData.name || user.email,
        photoURL: profileData.photoURL || "images/default-avatar.png",
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp()
      });

      showNotification("Post created!");
      const postContent = document.getElementById("profilePostContent");
      if (postContent) postContent.value = "";
      await loadMyPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      showNotification("Error creating post: " + error.message, true);
    }
  });
}

// ==================== LOAD POSTS ====================

async function loadMyPosts() {
  const myPosts = document.getElementById("myPosts");
  if (!myPosts) return;

  myPosts.innerHTML = "";

  try {
    const postsSnapshot = await getDocs(collection(db, "posts"));

    let totalPosts = 0;
    
    // Use Promise.all to wait for all posts to load
    
const postPromises = postsSnapshot.docs.map(postDoc => {

  const post = postDoc.data();

  if (
    post.userId === auth.currentUser.uid
  ) {
    totalPosts++;
  }

  return renderPost(postDoc);

});

await Promise.all(postPromises);

const postCount =
  document.getElementById(
    "postCount"
  );

if (postCount) {
  postCount.textContent =
    totalPosts;
}

    } catch (error) {
    console.error(
      "Error loading posts:",
      error
    );

    showNotification(
      "Error loading posts: " +
      error.message,
      true
    );
  }

}

/**
 * Render a single post with comments
 */
async function renderPost(postDoc) {
  const myPosts = document.getElementById("myPosts");
  if (!myPosts) return;

  const post = postDoc.data();

  if (
  post.userId !== auth.currentUser.uid
) return;

  // Create post container
  const div = document.createElement("div");
  div.className = "post-container";
  div.setAttribute("data-post-id", postDoc.id);

  // Sanitize user content
  const sanitizedUsername = sanitizeText(post.username || "User");
  const sanitizedContent = sanitizeText(post.content);
  const photoURL = post.photoURL || "images/default-avatar.png";

  div.innerHTML = `
    <div class="post-header">
      <img
        src="${photoURL}"
        class="post-avatar"
        width="40"
        alt="User avatar"
        onerror="this.src='images/default-avatar.png'"
      >
      <strong>${sanitizedUsername}</strong>

<br>

<small>
  ${
    post.createdAt
      ? new Date(
          post.createdAt.seconds * 1000
        ).toLocaleString()
      : ""
  }
</small>
      
    </div>
    <p class="post-content">${sanitizedContent}</p>
    <div class="post-actions">
      <button class="like-btn" data-id="${postDoc.id}">
        ❤️ <span class="like-count">${post.likes || 0}</span>
      </button>
      <button class="comment-btn" data-id="${postDoc.id}">
        💬 <span class="comment-count">${post.comments || 0}</span>
      </button>
      <button class="share-btn" data-id="${postDoc.id}">
        🔄 Share
      </button>
      <button class="delete-btn" data-id="${postDoc.id}">
        🗑 Delete
      </button>
    </div>
    <div class="comments-list" id="comments-${postDoc.id}"></div>
    <div class="comment-input-wrapper">
      <input
        type="text"
        class="comment-input"
        data-id="${postDoc.id}"
        placeholder="Write a comment..."
        maxlength="500"
      >
      <button class="send-comment-btn" data-id="${postDoc.id}">Send</button>
    </div>
    <hr>
  `;

  myPosts.appendChild(div);

  // Load comments
  await loadComments(postDoc.id, div);
}

/**
 * Load and render comments for a post
 */
async function loadComments(postId, postElement) {
  try {
    const commentsContainer = postElement.querySelector(`#comments-${postId}`);
    if (!commentsContainer) return;

    const commentsSnapshot = await getDocs(
      collection(db, "posts", postId, "comments")
    );

    commentsSnapshot.forEach((commentDoc) => {
      const comment = commentDoc.data();
      const p = document.createElement("p");
      p.className = "comment";
      
      // Sanitize comment content
      const sanitizedUsername = sanitizeText(comment.username);
      const sanitizedText = sanitizeText(comment.text);
      
      p.innerHTML = `<strong>${sanitizedUsername}</strong>: ${sanitizedText}`;
      commentsContainer.appendChild(p);
    });
  } catch (error) {
    console.error("Error loading comments:", error);
  }
}

// ==================== EVENT DELEGATOR ====================
// Consolidate all click handlers to avoid memory leaks

document.addEventListener("click", async (e) => {
  const target = e.target.closest("button");
  if (!target) return;

  const postId = target.dataset.id;

  // Delete post
  if (target.classList.contains("delete-btn")) {
    await handleDeletePost(postId);
  }
  // Share post
  else if (target.classList.contains("share-btn")) {
    handleSharePost(postId);
  }
  // Send comment
  else if (target.classList.contains("send-comment-btn")) {
    await handleSendComment(postId);
  }
  // Like post
  else if (target.classList.contains("like-btn")) {
    await handleLikePost(postId);
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

/**
 * Handle send comment action
 */
async function handleSendComment(postId) {
  const user = auth.currentUser;
  if (!user) {
    showNotification("Please login", true);
    return;
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
    const profileData = userSnap.data();

    await addDoc(collection(db, "posts", postId, "comments"), {
      text,
      userId: user.uid,
      username: profileData.name || user.email,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "posts", postId), {
      comments: increment(1)
    });

    input.value = "";
    showNotification("Comment added!");
    await loadMyPosts();
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

  console.log("Settings button:", settingsBtn);

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
    !profileMenu.contains(e.target) &&
    !menuBtn.contains(e.target)
  ) {
    profileMenu.classList.remove("show");
  }
});

const blockUserBtn = document.getElementById("blockUser");
const reportUserBtn = document.getElementById("reportUser");
const shareProfileBtn = document.getElementById("shareProfile");

// SHARE PROFILE
if (shareProfileBtn) {
  shareProfileBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    const link = `${window.location.origin}/profile.html?uid=${user.uid}`;

    await navigator.clipboard.writeText(link);
    showNotification("Profile link copied!");
  });
}

// BLOCK USER (simple version for now)
if (blockUserBtn) {
  blockUserBtn.addEventListener("click", async () => {
    const user = auth.currentUser;

    const confirmBlock = confirm("Block this user?");
    if (!confirmBlock) return;

    await setDoc(doc(db, "blockedUsers", user.uid), {
      createdAt: serverTimestamp()
    });

    showNotification("User blocked");
  });
}

// REPORT USER (simple version)
if (reportUserBtn) {
  reportUserBtn.addEventListener("click", async () => {
    const user = auth.currentUser;

    const reason = prompt("Why are you reporting this user?");
    if (!reason) return;

    await addDoc(collection(db, "reports"), {
      userId: user.uid,
      reason,
      createdAt: serverTimestamp()
    });

    showNotification("Report submitted");
  });
}

