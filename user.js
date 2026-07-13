import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const uid = params.get("uid");

// Function to show error message
function showError(message) {
  document.getElementById("userName").textContent = message;
  document.getElementById("userBio").textContent = "User not found or no longer available";
  document.getElementById("userPhoto").src = "images/default-avatar.png";
}

// Check if uid exists
if (!uid) {
  showError("No user specified");
} else {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));

    if (userDoc.exists()) {
      const data = userDoc.data();

      document.getElementById("userPhoto").src = data.photoURL || "images/default-avatar.png";

      document.getElementById("userName").textContent = data.name || "No Name";

      const joinDate = document.getElementById("joinDate");

      if (joinDate && data.createdAt) {
        const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        joinDate.textContent = "Member since: " + date.toLocaleDateString();
      }

      document.getElementById("userBio").textContent = data.bio || "No bio yet";

      const followBtn = document.getElementById("followBtn");

      const currentUser = auth.currentUser;

      if (currentUser && currentUser.uid !== uid) {
        const followRef = doc(db, "users", uid, "followers", currentUser.uid);
        const existingFollow = await getDoc(followRef);
        if (existingFollow.exists()) {
          followBtn.textContent = "Following";
        }
      }

      if (currentUser && currentUser.uid !== uid) {
        followBtn.addEventListener("click", async () => {
          const followRef = doc(db, "users", uid, "followers", currentUser.uid);
          const existingFollow = await getDoc(followRef);
          if (existingFollow.exists()) {
            await deleteDoc(followRef);
            const followingRef = doc(db, "users", currentUser.uid, "following", uid);
            await deleteDoc(followingRef);
            followBtn.textContent = "Follow";
          } else {
            await setDoc(followRef, { userId: currentUser.uid });
            const followingRef = doc(db, "users", currentUser.uid, "following", uid);
            await setDoc(followingRef, { userId: uid });
            await addDoc(collection(db, "notifications"), {
              userId: uid,
              senderId: currentUser.uid,
              type: "follow",
              createdAt: serverTimestamp(),
              read: false
            });
            followBtn.textContent = "Following";
          }
        });
      }

      const followersCount = document.getElementById("followersCount");
      const followingCount = document.getElementById("followingCount");

      const followersSnapshot = await getDocs(collection(db, "users", uid, "followers"));
      followersCount.textContent = followersSnapshot.size;
      const followingSnapshot = await getDocs(collection(db, "users", uid, "following"));
      followingCount.textContent = followingSnapshot.size;

      document.getElementById("followersLink").href = `followers.html?uid=${uid}`;
      document.getElementById("followingLink").href = `following.html?uid=${uid}`;

      const postsQuery = query(collection(db, "posts"), where("userId", "==", uid));
      const postsSnapshot = await getDocs(postsQuery);

      const postCount = document.getElementById("postCount");
      if (postCount) {
        postCount.textContent = postsSnapshot.size;
      }

      const postsContainer = document.getElementById("userPosts");
      postsContainer.innerHTML = "";

      // Use for...of so we can await inside the loop and catch per-post errors
      for (const postDoc of postsSnapshot.docs) {
        try {
          const post = postDoc.data();

          const div = document.createElement("div");

          div.innerHTML = `

  <div class="post-header">

    <img
      src="${post.photoURL || 'images/default-avatar.png'}"
      class="post-avatar"
      width="50"
    >

    <span class="post-user">
      ${post.username || "User"}
    </span>

  </div>

  <p>
    ${post.content}
  </p>

  <div class="post-actions">

    <button
      class="like-btn"
      data-id="${postDoc.id}">
      ❤️ ${post.likes || 0}
    </button>

    <button
      class="comment-btn"
      data-id="${postDoc.id}">
      💬 ${post.comments || 0}
    </button>

    <button
      class="share-btn"
      data-id="${postDoc.id}">
      🔄 Share
    </button>

  </div>

  <div class="comment-section">

    <div
      class="comments-list"
      id="comments-${postDoc.id}">
    </div>

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

  <hr>

  `;

          postsContainer.appendChild(div);

          const commentsContainer = div.querySelector(`#comments-${postDoc.id}`);

          try {
            const commentsSnapshot = await getDocs(collection(db, "posts", postDoc.id, "comments"));

            console.log("Comments found:", commentsSnapshot.size);

            commentsSnapshot.forEach((commentDoc) => {
              const comment = commentDoc.data();
              const p = document.createElement("p");
              p.innerHTML = `<strong>${comment.username}</strong>: ${comment.text}`;
              commentsContainer.appendChild(p);
            });

          } catch (err) {
            console.error("Error loading comments for post", postDoc.id, err);
          }

        } catch (err) {
          console.error('Error loading post', postDoc.id, err);
        }
      }

    } else {
      // User document doesn't exist
      showError("User not found");
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
    showError("Error loading user profile");
  }
}

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("like-btn")) return;

  const user = auth.currentUser;
  if (!user) {
    alert("Please login first");
    return;
  }

  const postId = e.target.dataset.id;
  const likeRef = doc(db, "posts", postId, "likes", user.uid);

  try {
    const existingLike = await getDoc(likeRef);
    if (existingLike.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(doc(db, "posts", postId), { likes: increment(-1) });
    } else {
      await setDoc(likeRef, { userId: user.uid });
      await updateDoc(doc(db, "posts", postId), { likes: increment(1) });
    }

    location.reload();
  } catch (error) {
    console.error("Like error:", error);
  }
});

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("send-comment-btn")) return;

  const user = auth.currentUser;
  if (!user) {
    alert("Please login first");
    return;
  }

  const postId = e.target.dataset.id;
  const input = document.querySelector(`.comment-input[data-id="${postId}"]`);
  const text = input.value.trim();
  if (!text) return;

  try {
    const userProfile = await getDoc(doc(db, "users", user.uid));
    const profileData = userProfile.data();

    await addDoc(collection(db, "posts", postId, "comments"), {
      text,
      userId: user.uid,
      username: profileData.name || user.email,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "posts", postId), { comments: increment(1) });
    input.value = "";
    location.reload();

  } catch (error) {
    console.error("Comment error:", error);
  }
});

const messageBtn = document.getElementById("messageBtn");
if (messageBtn && uid) {
  messageBtn.addEventListener("click", () => {
    window.location.href = `chat.html?uid=${uid}`;
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("share-btn")) return;
  const profileLink = window.location.href;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(profileLink)}`;
  window.open(whatsappUrl, "_blank");
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
      reporterId: user.uid,
      reportedUserId: uid,
      reason,
      createdAt: serverTimestamp()
});

    showNotification("Report submitted");
  });
}
