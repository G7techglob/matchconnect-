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
  increment,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// ================================
// GET POST ID
// ================================

const params =
  new URLSearchParams(window.location.search);

const postId =
  params.get("postId");


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
// CHECK POST
// ================================

if (!postId) {

  postContainer.innerHTML = `
    <div class="loading">
      Post not found.
    </div>
  `;

} else {

  loadPost();
  loadComments();

}


// ================================
// LOAD POST
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

    let username =
      post.username || "User";

    let photoURL =
      post.photoURL ||
      "images/default-avatar.png";


    if (post.userId) {

      const userSnap =
        await getDoc(
          doc(db, "users", post.userId)
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


    postContainer.innerHTML = `

      <div class="comment-post">

        <div class="comment-post-header">

          <img
            src="${photoURL}"
            class="post-avatar view-profile"
            data-uid="${post.userId}"
            onerror="this.src='images/default-avatar.png'"
          >

          <span
            class="post-username view-profile"
            data-uid="${post.userId}"
          >
            ${escapeHTML(username)}
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

  }

}


// ================================
// LOAD MAIN COMMENTS
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


      for (const commentDoc of snapshot.docs) {

        const comment =
          commentDoc.data();

        const commentDiv =
          await createCommentElement(
            commentDoc.id,
            comment
          );

        commentsContainer.appendChild(
          commentDiv
        );

        loadReplies(
          commentDoc.id,
          commentDiv.querySelector(".replies")
        );

      }

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
// CREATE COMMENT
// ================================

async function createCommentElement(
  commentId,
  comment
) {

  let username =
    comment.username || "User";

  let photoURL =
    comment.photoURL ||
    "images/default-avatar.png";


  if (comment.userId) {

    try {

      const userSnap =
        await getDoc(
          doc(db, "users", comment.userId)
        );

      if (userSnap.exists()) {

        const userData =
          userSnap.data();

        username =
          userData.name || username;

        photoURL =
          userData.photoURL || photoURL;

      }

    } catch (error) {

      console.error(
        "Comment profile error:",
        error
      );

    }

  }


  const div =
    document.createElement("div");

  div.className =
    "comment-item";


  div.innerHTML = `

    <img
      src="${photoURL}"
      class="comment-avatar view-profile"
      data-uid="${comment.userId}"
      onerror="this.src='images/default-avatar.png'"
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
          data-parent-type="comment"
          data-parent-id="${commentId}"
        >
          Reply
        </button>

        <button
          class="like-comment-btn"
          data-id="${commentId}"
        >
          ❤️ ${comment.likes || 0}
        </button>

      </div>

      <div
        class="reply-box"
        style="display:none;"
      >

        <input
          type="text"
          class="reply-input"
          placeholder="Write a reply..."
        >

        <button
          class="send-reply-btn"
          data-parent-type="comment"
          data-parent-id="${commentId}"
        >
          Send
        </button>

      </div>

      <div class="replies"></div>

    </div>

  `;

  return div;

}


// ================================
// LOAD REPLIES RECURSIVELY
// ================================

function loadReplies(
  commentId,
  container,
  parentReplyId = null
) {

  let repliesRef;


  if (!parentReplyId) {

    repliesRef =
      collection(
        db,
        "posts",
        postId,
        "comments",
        commentId,
        "replies"
      );

  } else {

    repliesRef =
      collection(
        db,
        "posts",
        postId,
        "comments",
        commentId,
        "replies",
        parentReplyId,
        "replies"
      );

  }


  const q =
    query(
      repliesRef,
      orderBy("createdAt", "asc")
    );


  onSnapshot(
    q,
    async (snapshot) => {

      container.innerHTML = "";


      for (
        const replyDoc
        of snapshot.docs
      ) {

        const reply =
          replyDoc.data();


        const replyDiv =
          await createReplyElement(
            commentId,
            replyDoc.id,
            reply
          );


        container.appendChild(
          replyDiv
        );


        const nestedReplies =
          replyDiv.querySelector(
            ".nested-replies"
          );


        // Load replies to this reply

        loadReplies(
          commentId,
          nestedReplies,
          replyDoc.id
        );

      }

    },
    (error) => {

      console.error(
        "Replies error:",
        error
      );

    }
  );

}


// ================================
// CREATE REPLY
// ================================

async function createReplyElement(
  commentId,
  replyId,
  reply
) {

  let username =
    reply.username || "User";

  let photoURL =
    reply.photoURL ||
    "images/default-avatar.png";


  if (reply.userId) {

    try {

      const userSnap =
        await getDoc(
          doc(db, "users", reply.userId)
        );

      if (userSnap.exists()) {

        const userData =
          userSnap.data();

        username =
          userData.name || username;

        photoURL =
          userData.photoURL || photoURL;

      }

    } catch (error) {

      console.error(
        "Reply profile error:",
        error
      );

    }

  }


  const div =
    document.createElement("div");

  div.className =
    "reply-item";


  div.innerHTML = `

    <img
      src="${photoURL}"
      class="reply-avatar view-profile"
      data-uid="${reply.userId}"
      alt="Profile"
      onerror="this.src='images/default-avatar.png'"
    >

    <div class="reply-content">

      <span
        class="reply-username view-profile"
        data-uid="${reply.userId}"
      >
        ${escapeHTML(username)}
      </span>

      <div class="reply-text">
        ${escapeHTML(reply.text || "")}
      </div>

      <div class="reply-actions">

        <button
          class="reply-btn"
          data-parent-type="reply"
          data-comment-id="${commentId}"
          data-parent-id="${replyId}"
        >
          Reply
        </button>

        <button
  class="like-reply-btn"
  data-comment="${commentId}"
  data-id="${replyId}"
  data-parent-reply-id="${reply.parentReplyId || ""}"
>
  ❤️ ${reply.likes || 0}
</button>

      </div>

      <div
        class="reply-box"
        style="display:none;"
      >

        <input
          type="text"
          class="reply-input"
          placeholder="Write a reply..."
        >

        <button
          class="send-reply-btn"
          data-parent-type="reply"
          data-comment-id="${commentId}"
          data-parent-id="${replyId}"
        >
          Send
        </button>

      </div>

      <div class="nested-replies"></div>

    </div>

  `;


  return div;

}


// ================================
// CURRENT USER PHOTO
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
// SEND MAIN COMMENT
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

    const userSnap =
      await getDoc(
        doc(db, "users", user.uid)
      );

    const userData =
      userSnap.exists()
        ? userSnap.data()
        : {};


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
        username:
          userData.name ||
          user.email ||
          "User",
        photoURL:
          userData.photoURL ||
          "images/default-avatar.png",
        createdAt:
          serverTimestamp(),
        likes: 0
      }
    );


    await updateDoc(
      doc(db, "posts", postId),
      {
        comments: increment(1)
      }
    );


    const postSnap =
      await getDoc(
        doc(db, "posts", postId)
      );


    if (postSnap.exists()) {

      const post =
        postSnap.data();


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
            createdAt:
              serverTimestamp(),
            read: false
          }
        );

      }

    }


    commentInput.value = "";

    commentInput.focus();


  } catch (error) {

    console.error(
      "Send comment error:",
      error
    );

    alert(
      "Unable to send comment."
    );

  }

}


// ================================
// REPLY BUTTON
// ================================

document.addEventListener(
  "click",
  (e) => {

    const btn =
      e.target.closest(".reply-btn");

    if (!btn) return;


    const parent =
      btn.closest(
        ".comment-content, .reply-content"
      );

    if (!parent) return;


    const box =
      parent.querySelector(
        ":scope > .reply-box"
      );

    if (!box) return;


    box.style.display =
      box.style.display === "none"
        ? "flex"
        : "none";


    if (box.style.display === "flex") {

      const input =
        box.querySelector(
          ".reply-input"
        );

      if (input) {
        input.focus();
      }

    }

  }
);


// ================================
// SEND REPLY / REPLY TO REPLY
// ================================

document.addEventListener(
  "click",
  async (e) => {

    const btn =
      e.target.closest(
        ".send-reply-btn"
      );

    if (!btn) return;


    const user =
      auth.currentUser;

    if (!user) {

      alert("Please login first");

      return;

    }


    const textInput =
      btn.parentElement.querySelector(
        ".reply-input"
      );

    if (!textInput) return;


    const text =
      textInput.value.trim();

    if (!text) return;


    const parentType =
      btn.dataset.parentType;

    const parentId =
      btn.dataset.parentId;

    const commentId =
      btn.dataset.commentId ||
      parentId;


    try {

      const userSnap =
        await getDoc(
          doc(db, "users", user.uid)
        );

      const userData =
        userSnap.data() || {};


      let repliesRef;


      // =========================
      // REPLY TO MAIN COMMENT
      // =========================

      if (parentType === "comment") {

        repliesRef =
          collection(
            db,
            "posts",
            postId,
            "comments",
            parentId,
            "replies"
          );

      }


      // =========================
      // REPLY TO A REPLY
      // =========================

      else if (parentType === "reply") {

        repliesRef =
          collection(
            db,
            "posts",
            postId,
            "comments",
            commentId,
            "replies",
            parentId,
            "replies"
          );

      }


      if (!repliesRef) return;


      await addDoc(
  repliesRef,
  {
    text: text,

    userId: user.uid,

    username:
      userData.name ||
      user.email ||
      "User",

    photoURL:
      userData.photoURL ||
      "images/default-avatar.png",

    createdAt:
      serverTimestamp(),

    likes: 0,

    parentReplyId:
      parentType === "reply"
        ? parentId
        : null
  }
);


      textInput.value = "";

      textInput.focus();


    } catch (error) {

      console.error(
        "Send reply error:",
        error
      );

      alert(
        "Unable to send reply."
      );

    }

  }
);


// ================================
// LIKE MAIN COMMENT
// ================================

document.addEventListener(
  "click",
  async (e) => {

    const btn =
      e.target.closest(
        ".like-comment-btn"
      );

    if (!btn) return;


    const user =
      auth.currentUser;

    if (!user) {

      alert("Please login first");

      return;

    }


    const commentId =
      btn.dataset.id;


    const commentRef =
      doc(
        db,
        "posts",
        postId,
        "comments",
        commentId
      );


    const likeRef =
      doc(
        db,
        "posts",
        postId,
        "comments",
        commentId,
        "likes",
        user.uid
      );


    try {

      const likeSnap =
        await getDoc(likeRef);


      if (likeSnap.exists()) {

        await deleteDoc(likeRef);

        await updateDoc(
          commentRef,
          {
            likes:
              increment(-1)
          }
        );

      } else {

        await setDoc(
          likeRef,
          {
            userId:
              user.uid,
            createdAt:
              serverTimestamp()
          }
        );

        await updateDoc(
          commentRef,
          {
            likes:
              increment(1)
          }
        );

      }

    } catch (error) {

      console.error(
        "LIKE COMMENT ERROR:",
        error
      );

      alert(
        "Unable to like this comment."
      );

    }

  }
);

// ================================
// LIKE REPLY + REPLY TO REPLY
// ================================

document.addEventListener(
  "click",
  async (e) => {

    const btn =
      e.target.closest(
        ".like-reply-btn"
      );

    if (!btn) return;


    const user =
      auth.currentUser;

    if (!user) {

      alert("Please login first");

      return;

    }


    // Main comment ID
    const commentId =
      btn.dataset.comment;


    // Reply ID
    const replyId =
      btn.dataset.id;


    // Parent reply ID
    // This exists only when this is
    // a reply to another reply.
    const parentReplyId =
      btn.dataset.parentReply;


    if (!commentId || !replyId) {

      console.error(
        "Missing commentId or replyId"
      );

      return;

    }


    try {

      let replyRef;
      let likeRef;


      // =====================================
      // FIRST-LEVEL REPLY
      // =====================================

      if (!parentReplyId) {

        replyRef =
          doc(
            db,
            "posts",
            postId,
            "comments",
            commentId,
            "replies",
            replyId
          );


        likeRef =
          doc(
            db,
            "posts",
            postId,
            "comments",
            commentId,
            "replies",
            replyId,
            "likes",
            user.uid
          );

      }


      // =====================================
      // REPLY TO REPLY
      // =====================================

      else {

        replyRef =
          doc(
            db,
            "posts",
            postId,
            "comments",
            commentId,
            "replies",
            parentReplyId,
            "replies",
            replyId
          );


        likeRef =
          doc(
            db,
            "posts",
            postId,
            "comments",
            commentId,
            "replies",
            parentReplyId,
            "replies",
            replyId,
            "likes",
            user.uid
          );

      }


      // =====================================
      // CHECK LIKE
      // =====================================

      const likeSnap =
        await getDoc(
          likeRef
        );


      // =====================================
      // REMOVE LIKE
      // =====================================

      if (likeSnap.exists()) {

        await deleteDoc(
          likeRef
        );


        await updateDoc(
          replyRef,
          {
            likes:
              increment(-1)
          }
        );

      }


      // =====================================
      // ADD LIKE
      // =====================================

      else {

        await setDoc(
          likeRef,
          {
            userId:
              user.uid,

            createdAt:
              serverTimestamp()
          }
        );


        await updateDoc(
          replyRef,
          {
            likes:
              increment(1)
          }
        );

      }


    } catch (error) {

      console.error(
        "LIKE REPLY ERROR:",
        error
      );

      alert(
        "Unable to like this reply."
      );

    }

  }
);

// ================================
// OPEN USER PROFILE
// ================================

document.addEventListener(
  "click",
  (e) => {

    const profile =
      e.target.closest(
        ".view-profile"
      );

    if (!profile) return;


    const uid =
      profile.dataset.uid;


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
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

      }
