import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
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

    snapshot.forEach(async (postDoc) => {

      const post = postDoc.data();
      let profileName = post.username || "User";
let profilePhoto = post.photoURL || "images/default-avatar.png";

if(post.userId){

  const userSnap = await getDoc(
    doc(db, "users", post.userId)
  );

  if(userSnap.exists()){

    const userData = userSnap.data();

    profileName =
      userData.name || profileName;

    profilePhoto =
      userData.photoURL || profilePhoto;

  }

}

      let isFollowing = false;

if (
  auth.currentUser &&
  auth.currentUser.uid !== post.userId
) {

  const followingSnap = await getDoc(
    doc(
      db,
      "users",
      auth.currentUser.uid,
      "following",
      post.userId
    )
  );

  isFollowing = followingSnap.exists();

}

      const div = document.createElement("div");
      div.className = "post";

      div.innerHTML = `

<div class="post-header">

<img
src="${profilePhoto}"
class="post-avatar view-profile"
data-uid="${post.userId}"
>

<span
class="post-user view-profile"
data-uid="${post.userId}"
>
${profileName}
</span>

${
auth.currentUser &&
auth.currentUser.uid !== post.userId
? `
<button
class="follow-btn"
data-uid="${post.userId}">
${isFollowing ? "Following " : "Follow"}
</button>
`
: ""
}

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
  💬 ${post.comments || 0}
  </button>

  <button
class="share-btn"
data-id="${postDoc.id}">
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


`;

      const commentsContainer =
  div.querySelector(
    `#comments-${postDoc.id}`
  );

const commentsSnapshot =
  await getDocs(
    collection(
      db,
      "posts",
      postDoc.id,
      "comments"
    )
  );

commentsSnapshot.forEach(
  (commentDoc) => {

    const comment =
      commentDoc.data();

    const p =
      document.createElement("p");

    p.innerHTML =
      `<strong>${comment.username}</strong>: ${comment.text}`;

    commentsContainer.appendChild(p);

  }
);
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

      const userProfile = await getDoc(
  doc(db, "users", user.uid)
);

const profileData = userProfile.data();

      await addDoc(collection(db, "posts"), {
        content: content,
        userId: user.uid,
        username: profileData.name || user.email,
        photoURL: profileData.photoURL || "images/default-avatar.png",
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

  const postDocSnap =
    await getDoc(
      doc(db, "posts", postId)
    );

  const postData =
    postDocSnap.data();

  if (
    postData.userId !== user.uid
  ) {

    await addDoc(
      collection(
        db,
        "notifications"
      ),
      {
        userId:
          postData.userId,
        senderId:
          user.uid,
        type: "like",
        postId:
          postId,
        createdAt:
          serverTimestamp(),
        read: false
      }
    );

  }

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

  const userProfile = await getDoc(
  doc(db, "users", user.uid)
);

const profileData = userProfile.data();

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
        username: profileData.name || user.email,
        createdAt: serverTimestamp()
      }
    );

    const postDocSnap =
  await getDoc(
    doc(db, "posts", postId)
  );

const postData =
  postDocSnap.data();

if (
  postData.userId !== user.uid
) {

  await addDoc(
    collection(
      db,
      "notifications"
    ),
    {
      userId:
        postData.userId,
      senderId:
        user.uid,
      type: "comment",
      postId:
        postId,
      createdAt:
        serverTimestamp(),
      read: false
    }
  );

}

    console.log("COMMENT SAVED");

    input.value = "";

    await updateDoc(
      doc(db, "posts", postId),
      {
        comments: increment(1)
      }
    );

  } catch (error) {

  console.error("Comment error:", error);

  


}

});

document.addEventListener(
  "click",
  (e) => {

    if (
      !e.target.classList.contains(
        "view-profile"
      )
    ) return;

    const uid =
      e.target.dataset.uid;

    window.location.href =
      `user.html?uid=${uid}`;

  }
);

document.addEventListener(
  "click",
  (e) => {

    if (
      !e.target.classList.contains(
        "share-btn"
      )
    ) return;

    const postId =
      e.target.dataset.id;

    const postLink =
      `https://g7techglob.github.io/matchconnect-/post.html?id=${postId}`;

    const whatsappUrl =
      `https://wa.me/?text=${encodeURIComponent(postLink)}`;

    window.open(
      whatsappUrl,
      "_blank"
    );

  }
);

document.addEventListener("click", async (e) => {

  if (!e.target.classList.contains("follow-btn")) return;

  const currentUser = auth.currentUser;

  if (!currentUser) {
    alert("Please login first");
    return;
  }

  const targetUid = e.target.dataset.uid;

  if (targetUid === currentUser.uid) return;

  try {

    const followingRef = doc(
      db,
      "users",
      currentUser.uid,
      "following",
      targetUid
    );

    const followerRef = doc(
      db,
      "users",
      targetUid,
      "followers",
      currentUser.uid
    );

    const followingSnap = await getDoc(followingRef);

    if (followingSnap.exists()) {

      // Unfollow
      await deleteDoc(followingRef);
      await deleteDoc(followerRef);

      e.target.textContent = "Follow";

    } else {

      // Follow
      await setDoc(followingRef, {
        userId: targetUid,
        createdAt: serverTimestamp()
      });

      await setDoc(followerRef, {
  userId: currentUser.uid,
  createdAt: serverTimestamp()
});

await addDoc(
  collection(db, "notifications"),
  {
    userId: targetUid,
    senderId: currentUser.uid,
    type: "follow",
    createdAt: serverTimestamp(),
    read: false
  }
);

e.target.textContent = "Following ";

    }

  } catch (error) {

    console.error("Follow error:", error);

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
