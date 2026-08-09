import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// ================================
// GET POST ID FROM URL
// ================================

const params = new URLSearchParams(window.location.search);

const postId = params.get("postId");


// ================================
// UI ELEMENTS
// ================================

const postContainer =
  document.getElementById("postContainer");

const commentsContainer =
  document.getElementById("commentsContainer");

const commentInput =
  document.getElementById("commentInput");

const sendCommentBtn =
  document.getElementById("sendCommentBtn");

const myProfilePic =
  document.getElementById("myProfilePic");


// ================================
// CHECK POST ID
// ================================

if (!postId) {

  postContainer.innerHTML = `
    <div class="loading">
      Post not found.
    </div>
  `;

  console.error("No postId found in URL.");

} else {

  loadPost();
  loadComments();

}


// ================================
// LOAD SELECTED POST
// ================================

async function loadPost() {

  try {

    const postRef =
      doc(db, "posts", postId);

    const postSnap =
      await getDoc(postRef);

    if (!postSnap.exists()) {

      postContainer.innerHTML = `
        <div class="loading">
          This post no longer exists.
        </div>
      `;

      return;
    }

    const post =
      postSnap.data();

    let profileName =
      post.username || "User";

    let profilePhoto =
      post.photoURL ||
      "images/default-avatar.png";


    // Get latest profile information

    if (post.userId) {

      const userSnap =
        await getDoc(
          doc(db, "users", post.userId)
        );

      if (userSnap.exists()) {

        const userData =
          userSnap.data();

        profileName =
          userData.name || profileName;

        profilePhoto =
          userData.photoURL || profilePhoto;

      }

    }


    postContainer.innerHTML = `

      <div class="comment-post">

        <div class="comment-post-header">

          <img
            src="${profilePhoto}"
            class="post-avatar view-profile"
            data-uid="${post.userId}"
          >

          <span
            class="post-username view-profile"
            data-uid="${post.userId}"
          >
            ${escapeHTML(profileName)}
          </span>

        </div>

        <p class="post-content">
          ${escapeHTML(post.content || "")}
        </p>

      </div>

    `;

  } catch (error) {

    console.error(
      "Load post error:",
      error
    );

    postContainer.innerHTML = `
      <div class="loading">
        Unable to load post.
      </div>
    `;

  }

}


// ================================
// LOAD COMMENTS
// ================================

function loadComments() {

  const commentsRef =
    collection(
      db,
      "posts",
      postId,
      "comments"
    );

  const q =
    query(
      commentsRef,
      orderBy("createdAt", "asc")
    );


  onSnapshot(
    q,
    async (snapshot) => {

      commentsContainer.innerHTML = "";

      if (snapshot.empty) {

        commentsContainer.innerHTML = `
          <div class="no-comments">
            No comments yet.
          </div>
        `;

        return;
      }


      snapshot.forEach(
        async (commentDoc) => {

          const comment =
            commentDoc.data();

          let username =
            comment.username || "User";

          let photoURL =
            comment.photoURL ||
            "images/default-avatar.png";


          // Get latest profile information

          if (comment.userId) {

            const userSnap =
              await getDoc(
                doc(
                  db,
                  "users",
                  comment.userId
                )
              );

            if (userSnap.exists()) {

              const userData =
                userSnap.data();

              username =
                userData.name || username;

              photoURL =
                userData.photoURL || photoURL;

            }

          }


          const commentDiv =
            document.createElement("div");

          commentDiv.className =
            "comment-item";


          commentDiv.innerHTML = `

            <img
              src="${photoURL}"
              class="comment-avatar view-profile"
              data-uid="${comment.userId}"
            >

            <div class="comment-content">

  <span
    class="comment-username view-profile"
    data-uid="${comment.userId}"
  >
    ${escapeHTML(username)}
  </span>

  <div class="comment-text">
    ${escapeHTML(comment.text || "")}
  </div>

  <div class="comment-actions">

    <button
      class="reply-btn"
      data-id="${commentDoc.id}">
      Reply
    </button>

    <button
      class="like-comment-btn"
      data-id="${commentDoc.id}">
      ❤️ ${comment.likes || 0}
    </button>

  </div>

  <div
    class="reply-box"
    id="reply-box-${commentDoc.id}"
    style="display:none;">

    <input
      type="text"
      class="reply-input"
      data-id="${commentDoc.id}"
      placeholder="Write a reply...">

    <button
      class="send-reply-btn"
      data-id="${commentDoc.id}">
      Send
    </button>

  </div>

  <div
    class="replies"
    id="replies-${commentDoc.id}">
  </div>

</div>

          `;


          commentsContainer.appendChild(
            commentDiv
          );

        }
      );

    },
    (error) => {

      console.error(
        "Comments error:",
        error
      );

      commentsContainer.innerHTML = `
        <div class="loading">
          Unable to load comments.
        </div>
      `;

    }
  );

}


// ================================
// LOAD CURRENT USER PROFILE PHOTO
// ================================

auth.onAuthStateChanged(
  async (user) => {

    if (!user) return;

    try {

      const userSnap =
        await getDoc(
          doc(db, "users", user.uid)
        );

      if (userSnap.exists()) {

        const userData =
          userSnap.data();

        myProfilePic.src =
          userData.photoURL ||
          "images/default-avatar.png";

      }

    } catch (error) {

      console.error(
        "Profile photo error:",
        error
      );

    }

  }
);


// ================================
// SEND COMMENT
// ================================

sendCommentBtn.addEventListener(
  "click",
  sendComment
);


commentInput.addEventListener(
  "keydown",
  (e) => {

    if (e.key === "Enter") {

      e.preventDefault();

      sendComment();

    }

  }
);


async function sendComment() {

  const user =
    auth.currentUser;

  if (!user) {

    alert("Please login first");

    return;

  }


  const text =
    commentInput.value.trim();

  if (!text) return;


  try {

    // Get user profile

    const userSnap =
      await getDoc(
        doc(db, "users", user.uid)
      );

    const userData =
      userSnap.exists()
        ? userSnap.data()
        : {};


    const username =
      userData.name ||
      user.email ||
      "User";

    const photoURL =
      userData.photoURL ||
      "images/default-avatar.png";


    // Add comment

    await addDoc(
      collection(
        db,
        "posts",
        postId,
        "comments"
      ),
      {
        text: text,
        userId: user.uid,
        username: username,
        photoURL: photoURL,
        createdAt: serverTimestamp()
      }
    );


    // Update comment count

    await updateDoc(
      doc(db, "posts", postId),
      {
        comments: increment(1)
      }
    );


    // Get post owner

    const postSnap =
      await getDoc(
        doc(db, "posts", postId)
      );

    if (postSnap.exists()) {

      const post =
        postSnap.data();


      // Don't notify yourself

      if (post.userId !== user.uid) {

        await addDoc(
          collection(
            db,
            "notifications"
          ),
          {
            userId: post.userId,
            senderId: user.uid,
            type: "comment",
            postId: postId,
            createdAt: serverTimestamp(),
            read: false
          }
        );

      }

    }


    // Clear input

    commentInput.value = "";

    commentInput.focus();


  } catch (error) {

    console.error(
      "Send comment error:",
      error
    );

    alert(
      "Unable to send comment. Please try again."
    );

  }

}


// ================================
// OPEN USER PROFILE
// ================================

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


    if (!uid) return;


    window.location.href =
      `user.html?uid=${uid}`;

  }
);


// ================================
// SECURITY
// ================================

function escapeHTML(str) {

  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

      }

document.addEventListener("click", (e) => {

  const btn = e.target.closest(".reply-btn");

  if (!btn) return;

  const box = document.getElementById(
    `reply-box-${btn.dataset.id}`
  );

  if (!box) return;

  box.style.display =
    box.style.display === "none"
      ? "flex"
      : "none";

});

// ================================
// SEND REPLY
// ================================

document.addEventListener("click", async (e) => {

  const btn = e.target.closest(".send-reply-btn");

  if (!btn) return;

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first");
    return;
  }

  const commentId = btn.dataset.id;

  const input = document.querySelector(
    `.reply-input[data-id="${commentId}"]`
  );

  if (!input) return;

  const text = input.value.trim();

  if (!text) return;

  try {

    const userSnap = await getDoc(
      doc(db, "users", user.uid)
    );

    const userData = userSnap.data() || {};

    await addDoc(
      collection(
        db,
        "posts",
        postId,
        "comments",
        commentId,
        "replies"
      ),
      {
        text,
        userId: user.uid,
        username: userData.name || "User",
        photoURL:
          userData.photoURL ||
          "images/default-avatar.png",
        createdAt: serverTimestamp(),
        likes: 0
      }
    );

    input.value = "";

  } catch (error) {

    console.error(error);

  }

});
