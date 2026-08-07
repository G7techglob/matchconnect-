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

    console.log("Loading my posts...");
await loadMyPosts();

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

  const currentUser = auth.currentUser;

if (!currentUser) {
  console.log("No logged in user found");
  return;
}

console.log("Current user ID:", currentUser.uid);

  try {
    const postsSnapshot = await getDocs(collection(db, "posts"));
    console.log("Number of posts:", postsSnapshot.size);

    let count = 0;

for (const postDoc of postsSnapshot.docs) {
  const post = postDoc.data();

  if (post.userId === currentUser.uid) {
    count++;
    await renderPost(postDoc);
  }
}

const postCount = document.getElementById("postCount");

if (postCount) {
  postCount.textContent = count;
}
  } catch (error) {
    console.error("Error loading posts:", error);
    showNotification("Error loading posts: " + error.message, true);
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
 * Render a single post with comments
 */
async function renderPost(postDoc) {
  const myPosts = document.getElementById("myPosts");
  if (!myPosts) return;

  const post = postDoc.data();

  if (post.userId !== auth.currentUser?.uid) return;

  // Create post container
  const div = document.createElement("div");
  div.className = "post-container";
  div.setAttribute("data-post-id", postDoc.id);

  // Sanitize user content
  const sanitizedUsername = sanitizeText(post.username || "User");
  const sanitizedContent = sanitizeText(post.content || "");
  const photoURL = safeImageUrl(post.photoURL);

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
          post.createdAt?.seconds
            ? new Date(post.createdAt.seconds * 1000).toLocaleString()
            : ""
        }
      </small>
    </div>
    <p class="post-content">${sanitizedContent}</p>

${post.imageURL ? `
<img 
src="${safeImageUrl(post.imageURL)}"
class="post-image"
alt="Post image"
>
` : ""}

<div class="post-actions">
      <button class="like-btn" data-id="${postDoc.id}">
        ❤️ <span class="like-count">${post.likes || 0}</span>
      </button>
      <button class="comment-btn" data-id="${postDoc.id}">
        💬 <span class="comment-count">${post.comments || 0}</span>
      </button>
      <button class="share-btn" data-id="${postDoc.id}">
        🔄
      </button>
      <button class="delete-btn" data-id="${postDoc.id}">
        🗑
      </button>
    </div>
    
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

<div class="comments-list" id="comments-${postDoc.id}"></div>

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

    const commentsSnapshot = await getDocs(collection(db, "posts", postId, "comments"));

    commentsSnapshot.forEach((commentDoc) => {
      const comment = commentDoc.data();
      const p = document.createElement("p");
      p.className = "comment";

      // Sanitize comment content
      const sanitizedUsername = sanitizeText(comment.username || "User");
      const sanitizedText = sanitizeText(comment.text || "");

      p.innerHTML = `
<div class="comment-content">
    <strong>${sanitizedUsername}</strong>
    <span>${sanitizedText}</span>
</div>

<div class="comment-actions">

<button class="like-comment-btn" data-comment="${commentDoc.id}" data-post="${postId}">
❤️ <span class="comment-like-count">${comment.likes || 0}</span>
</button>

<button class="reply-comment-btn" data-comment="${commentDoc.id}">
Reply
</button>

</div>

<div class="reply-box" id="reply-${commentDoc.id}" style="display:none">

<input 
class="reply-input"
placeholder="Write a reply..."
data-comment="${commentDoc.id}"
>

<button 
class="send-reply-btn"
data-comment="${commentDoc.id}"
data-post="${postId}">
Send
</button>

</div>

<div class="replies-list" id="replies-${commentDoc.id}"></div>
`;
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
  if (!postId) return;

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

const blockUserBtn = document.getElementById("blockUser");
const reportUserBtn = document.getElementById("reportUser");
const shareProfileBtn = document.getElementById("shareProfile");

// SHARE PROFILE
if (shareProfileBtn) {
  shareProfileBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      showNotification("Please login", true);
      return;
    }

    const link = `${window.location.origin}/profile.html?uid=${user.uid}`;

    try {
      await navigator.clipboard.writeText(link);
      showNotification("Profile link copied!");
    } catch (error) {
      console.error("Clipboard write failed:", error);
      showNotification("Unable to copy link", true);
    }
  });
}

// BLOCK / UNBLOCK USER

if (blockUserBtn) {

  const user = auth.currentUser;


  if(user && user.uid !== uid){


    async function checkBlock(){

      const q = query(
        collection(db,"blockedUsers"),
        where("blockerId","==",user.uid),
        where("blockedUserId","==",uid)
      );


      const snapshot = await getDocs(q);


      if(!snapshot.empty){

        blockUserBtn.innerHTML =
        "Unblock User";

        return snapshot.docs[0].id;

      }else{

        blockUserBtn.innerHTML =
        "Block User";

        return null;

      }

    }



    let blockDocumentId = await checkBlock();



    blockUserBtn.addEventListener("click", async()=>{


      // UNBLOCK

      if(blockDocumentId){


        await deleteDoc(
          doc(
            db,
            "blockedUsers",
            blockDocumentId
          )
        );


        blockDocumentId = null;


        blockUserBtn.innerHTML =
        "Block User";


        showNotification("User unblocked");


        return;

      }



      // BLOCK

      const confirmBlock =
      confirm("Block this user?");


      if(!confirmBlock) return;



      const newBlock =
      await addDoc(
        collection(db,"blockedUsers"),
        {
          blockerId:user.uid,
          blockedUserId:uid,
          createdAt:serverTimestamp()
        }
      );


      blockDocumentId = newBlock.id;


      blockUserBtn.innerHTML =
      "Unblock User";


      showNotification("User blocked");


    });


  }

}

// REPORT USER (simple version)
if (reportUserBtn) {
  reportUserBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      showNotification("Please login", true);
      return;
    }

    const reason = prompt("Why are you reporting this user?");
    if (!reason) return;

    try {
      await addDoc(collection(db, "reports"), {
        userId: user.uid,
        reason: reason.trim(),
        createdAt: serverTimestamp()
      });

      showNotification("Report submitted");
    } catch (error) {
      console.error("Error reporting user:", error);
      showNotification("Error reporting user: " + error.message, true);
    }
  });
}

async function loadPhotos(uid) {
  const container = document.getElementById("mediaContainer");
  if (!container) return;

  container.innerHTML = "";

  const photosSnap = await getDocs(collection(db, "users", uid, "photos"));

  if (photosSnap.empty) {
    container.innerHTML = "No photos yet";
    return;
  }

  photosSnap.forEach((photoDoc) => {
    const photo = photoDoc.data();
    const imgUrl = safeImageUrl(photo.imageURL, "");

    if (!imgUrl) return;

    container.innerHTML += `
      <img
        src="${imgUrl}"
        class="profile-media"
        alt="User photo"
      >
    `;
  });
}

async function loadReels(uid) {
  const container = document.getElementById("mediaContainer");
  if (!container) return;

  container.innerHTML = "";

  const reelsSnap = await getDocs(collection(db, "users", uid, "reels"));

  if (reelsSnap.empty) {
    container.innerHTML = "No reels yet";
    return;
  }

  reelsSnap.forEach((reelDoc) => {
    const reel = reelDoc.data();
    const reelUrl = safeImageUrl(reel.videoURL, "");

    if (!reelUrl) return;

    container.innerHTML += `
      <video
        src="${reelUrl}"
        class="profile-media"
        controls>
      </video>
    `;
  });
}

