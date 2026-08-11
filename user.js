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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");

// ===============================
// SHOW ERROR
// ===============================

function showError(message) {
  const userName = document.getElementById("userName");
  const userBio = document.getElementById("userBio");
  const userPhoto = document.getElementById("userPhoto");

  if (userName) {
    userName.textContent = message;
  }

  if (userBio) {
    userBio.textContent =
      "User not found or no longer available";
  }

  if (userPhoto) {
    userPhoto.src = "images/default-avatar.png";
  }
}

// ===============================
// LOAD USER PROFILE
// ===============================

if (!uid) {

  showError("No user specified");

} else {

  try {

    const userDoc = await getDoc(
      doc(db, "users", uid)
    );

    if (!userDoc.exists()) {

      showError("User not found");

    } else {

      const data = userDoc.data();

      // ===============================
      // BASIC PROFILE INFORMATION
      // ===============================

      const userPhoto =
        document.getElementById("userPhoto");

      const userName =
        document.getElementById("userName");

      const userBio =
        document.getElementById("userBio");

      if (userPhoto) {
        userPhoto.src =
          data.photoURL ||
          "images/default-avatar.png";
      }

      if (userName) {
        userName.textContent =
          data.name || "No Name";
      }

      if (userBio) {
        userBio.textContent =
          data.bio || "No bio yet";
      }

      // ===============================
      // JOIN DATE
      // ===============================

      const joinDate =
        document.getElementById("joinDate");

      if (joinDate && data.createdAt) {

        const date =
          data.createdAt.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt);

        joinDate.textContent =
          "Member since: " +
          date.toLocaleDateString();
      }

      // ===============================
      // CURRENT USER
      // ===============================

      const currentUser = auth.currentUser;

      // ===============================
      // FOLLOW SYSTEM
      // ===============================

      const followBtn =
        document.getElementById("followBtn");

      if (
        followBtn &&
        currentUser &&
        currentUser.uid !== uid
      ) {

        const followRef = doc(
          db,
          "users",
          uid,
          "followers",
          currentUser.uid
        );

        const existingFollow =
          await getDoc(followRef);

        if (existingFollow.exists()) {
          followBtn.textContent = "Following";
        } else {
          followBtn.textContent = "Follow";
        }

        followBtn.addEventListener(
          "click",
          async () => {

            try {

              const existing =
                await getDoc(followRef);

              if (existing.exists()) {

                // UNFOLLOW

                await deleteDoc(followRef);

                const followingRef = doc(
                  db,
                  "users",
                  currentUser.uid,
                  "following",
                  uid
                );

                await deleteDoc(followingRef);

                followBtn.textContent = "Follow";

              } else {

                // FOLLOW

                await setDoc(
                  followRef,
                  {
                    userId: currentUser.uid
                  }
                );

                const followingRef = doc(
                  db,
                  "users",
                  currentUser.uid,
                  "following",
                  uid
                );

                await setDoc(
                  followingRef,
                  {
                    userId: uid
                  }
                );

                await addDoc(
                  collection(db, "notifications"),
                  {
                    userId: uid,
                    senderId: currentUser.uid,
                    type: "follow",
                    createdAt: serverTimestamp(),
                    read: false
                  }
                );

                followBtn.textContent =
                  "Following";
              }

              // Refresh follower count
              const followersSnapshot =
                await getDocs(
                  collection(
                    db,
                    "users",
                    uid,
                    "followers"
                  )
                );

              const followersCount =
                document.getElementById(
                  "followersCount"
                );

              if (followersCount) {
                followersCount.textContent =
                  followersSnapshot.size;
              }

            } catch (error) {

              console.error(
                "Follow error:",
                error
              );

              alert(
                "Unable to update follow status."
              );
            }

          }
        );
      }

      // ===============================
      // FOLLOWERS / FOLLOWING COUNTS
      // ===============================

      const followersSnapshot =
        await getDocs(
          collection(
            db,
            "users",
            uid,
            "followers"
          )
        );

      const followingSnapshot =
        await getDocs(
          collection(
            db,
            "users",
            uid,
            "following"
          )
        );

      const followersCount =
        document.getElementById(
          "followersCount"
        );

      const followingCount =
        document.getElementById(
          "followingCount"
        );

      if (followersCount) {
        followersCount.textContent =
          followersSnapshot.size;
      }

      if (followingCount) {
        followingCount.textContent =
          followingSnapshot.size;
      }

      // ===============================
      // FOLLOWERS / FOLLOWING LINKS
      // ===============================

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
          `followers.html?uid=${uid}`;
      }

      if (followingLink) {
        followingLink.href =
          `following.html?uid=${uid}`;
      }

      // ===============================
      // LOAD USER POSTS
      // ===============================

      const postsQuery = query(
        collection(db, "posts"),
        where("userId", "==", uid)
      );

      const postsSnapshot =
        await getDocs(postsQuery);

      // ===============================
      // POST COUNT
      // ===============================

      const postCount =
        document.getElementById("postCount");

      if (postCount) {
        postCount.textContent =
          postsSnapshot.size;
      }

      // ===============================
      // POSTS CONTAINER
      // ===============================

      const postsContainer =
        document.getElementById(
          "userPosts"
        );

      if (postsContainer) {

        postsContainer.innerHTML = "";

        if (postsSnapshot.empty) {

          postsContainer.innerHTML =
            "<p>No posts yet.</p>";

        } else {

          for (
            const postDoc
            of postsSnapshot.docs
          ) {

            const post =
              postDoc.data();

            const div =
              document.createElement("div");

            div.className =
              "post";

            div.innerHTML = `

              <div class="post-header">

                <img
                  src="${
                    post.photoURL ||
                    "images/default-avatar.png"
                  }"
                  class="post-avatar view-profile"
                  data-uid="${post.userId}"
                  alt="Profile"
                >

                <span
                  class="post-user view-profile"
                  data-uid="${post.userId}"
                >
                  ${
                    post.username ||
                    "User"
                  }
                </span>

              </div>

              <p class="post-content">
                ${
                  post.content || ""
                }
              </p>

              <div class="post-actions">

                <button
                  class="like-btn"
                  data-id="${postDoc.id}"
                >
                  ❤️
                  ${
                    post.likes || 0
                  }
                </button>

                <button
                  class="comment-btn"
                  data-id="${postDoc.id}"
                >
                  💬
                  ${
                    post.comments || 0
                  }
                </button>

                <button
                  class="share-btn"
                  data-id="${postDoc.id}"
                >
                  <i class="fa-solid fa-share"></i>
                </button>

              </div>

            `;

            postsContainer.appendChild(div);
          }
        }
      }
    }

  } catch (error) {

    console.error(
      "Error loading user profile:",
      error
    );

    showError(
      "Error loading user profile"
    );
  }
}

// ===============================
// LIKE POST
// ===============================

document.addEventListener(
  "click",
  async (e) => {

    const likeBtn =
      e.target.closest(".like-btn");

    if (!likeBtn) return;

    const user =
      auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    const postId =
      likeBtn.dataset.id;

    if (!postId) return;

    const likeRef = doc(
      db,
      "posts",
      postId,
      "likes",
      user.uid
    );

    try {

      const existingLike =
        await getDoc(likeRef);

      if (existingLike.exists()) {

        await deleteDoc(likeRef);

        await updateDoc(
          doc(db, "posts", postId),
          {
            likes: increment(-1)
          }
        );

      } else {

        await setDoc(
          likeRef,
          {
            userId: user.uid
          }
        );

        await updateDoc(
          doc(db, "posts", postId),
          {
            likes: increment(1)
          }
        );
      }

      location.reload();

    } catch (error) {

      console.error(
        "Like error:",
        error
      );
    }
  }
);

// ===============================
// OPEN COMMENTS PAGE
// ===============================

document.addEventListener(
  "click",
  (e) => {

    const commentBtn =
      e.target.closest(".comment-btn");

    if (!commentBtn) return;

    const postId =
      commentBtn.dataset.id;

    if (!postId) return;

    window.location.href =
      `comments.html?postId=${postId}`;
  }
);



// ===============================
// SHARE POST
// ===============================

document.addEventListener(
  "click",
  (e) => {

    const shareBtn =
      e.target.closest(".share-btn");

    if (!shareBtn) return;

    const postId =
      shareBtn.dataset.id;

    if (!postId) {
      console.error("No post ID found for share button");
      return;
    }

    // Direct link to the specific post
    const postLink =
      `https://g7techglob.github.io/matchconnect-/post.html?id=${postId}`;

    // Share through WhatsApp
    const whatsappUrl =
      `https://wa.me/?text=${encodeURIComponent(postLink)}`;

    window.open(
      whatsappUrl,
      "_blank"
    );
  }
);

// ===============================
// MESSAGE BUTTON
// ===============================

const messageBtn =
  document.getElementById(
    "messageBtn"
  );

if (messageBtn && uid) {

  messageBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        `chat.html?uid=${uid}`;
    }
  );
}

// ===============================
// PHOTOS TAB
// ===============================

const userPhotosTab =
  document.getElementById(
    "userPhotosTab"
  );

if (userPhotosTab && uid) {

  userPhotosTab.addEventListener(
    "click",
    () => {

      window.location.href =
        `media.html?uid=${uid}&type=photos`;
    }
  );
}

// ===============================
// REELS TAB
// ===============================

const userReelsTab =
  document.getElementById(
    "userReelsTab"
  );

if (userReelsTab && uid) {

  userReelsTab.addEventListener(
    "click",
    () => {

      window.location.href =
        `media.html?uid=${uid}&type=reels`;
    }
  );
}

// ===============================
// POSTS TAB
// ===============================

const userPostsTab =
  document.getElementById(
    "userPostsTab"
  );

if (userPostsTab) {

  userPostsTab.addEventListener(
    "click",
    () => {

      const posts =
        document.getElementById(
          "userPosts"
        );

      if (posts) {

        posts.scrollIntoView({
          behavior: "smooth"
        });

      }
    }
  );
}
